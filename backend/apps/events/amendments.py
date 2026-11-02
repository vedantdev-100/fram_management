import uuid
from datetime import timedelta
from django.conf import settings
from django.utils import timezone
from django.db.models import Sum
from rest_framework.exceptions import ValidationError
from apps.core.commands import command, check_version
from apps.core.errors import Conflict
from apps.assets.models import StockItem, StockLot, MachineDetail, LivingDetail
from apps.costing.models import CostRecord, CostAllocation, DepreciationEntry
from apps.ledger.models import LedgerEntry
from apps.compliance.models import TreatmentRecord
from .models import Event, EventTarget, SubEvent, StockMovement, MeterEntry, LivingEntry
from .services import authorize_event, lock_assets, create_event, _confirm


@command("events.event.amend")
def amend_event(ctx, event_id, version, reason, replacement):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "amend")
    check_version(e, version)
    if not reason:
        raise ValidationError("Amendment reason is required.")
    if e.status != "done" or e.reversal_of_id or Event.objects.filter(reversal_of=e).exists():
        raise Conflict("Event is not amendable or already reversed.")
    if timezone.now() - e.confirmed_at > timedelta(days=settings.AMENDMENT_DAYS):
        raise Conflict("Amendment time window expired.")
    lines = list(SubEvent.objects.filter(event=e))
    lock_assets(ctx, lines)
    if any(s.capitalize_to_asset_id or s.kind == "asset_status" for s in lines):
        raise Conflict("Capital additions and status disposal require a dedicated correction event.")
    reverse = Event.objects.create(
        farm=ctx.farm,
        event_type=e.event_type,
        event_type_version=e.event_type_version,
        title="Reversal: " + e.title,
        status="done",
        planned_start=e.planned_start,
        planned_end=e.planned_end,
        actual_start=e.actual_start,
        actual_end=e.actual_end,
        confirmed_by=ctx.user,
        confirmed_at=timezone.now(),
        client_uuid=uuid.uuid4(),
        reversal_of=e,
        notes=reason,
    )
    for target in EventTarget.objects.filter(event=e):
        values = {
            f.name: getattr(target, f.name)
            for f in target._meta.fields
            if f.name
            not in ("id", "event", "created_at", "updated_at", "created_by", "updated_by", "version")
        }
        EventTarget.objects.create(event=reverse, **values)
    for s in lines:
        rs = SubEvent.objects.create(
            farm=ctx.farm,
            event=reverse,
            line_no=s.line_no,
            kind=s.kind,
            asset=s.asset,
            qty_unit=s.qty_unit,
            planned_qty=s.planned_qty,
            actual_qty=s.actual_qty,
            qty_canonical=-s.qty_canonical,
            planned_start=s.planned_start,
            planned_end=s.planned_end,
            actual_start=s.actual_start,
            actual_end=s.actual_end,
            status="done",
            client_uuid=uuid.uuid4(),
            notes=reason,
        )
        for m in StockMovement.objects.filter(sub_event=s):
            item = StockItem.objects.select_for_update().get(pk=m.stock_item_id)
            lot = StockLot.objects.select_for_update().get(pk=m.lot_id) if m.lot_id else None
            if item.on_hand_qty - m.qty_canonical < 0 or (lot and lot.remaining_qty - m.qty_canonical < 0):
                raise Conflict("Reverse dependent stock use first.")
            StockMovement.objects.create(
                farm=ctx.farm,
                sub_event=rs,
                stock_item=item,
                lot=lot,
                movement_type="out" if m.qty_canonical > 0 else "in",
                qty_canonical=-m.qty_canonical,
                unit_cost=m.unit_cost,
                value=-m.value,
                occurred_at=m.occurred_at,
                reversal_of=m,
            )
            item.on_hand_qty -= m.qty_canonical
            value = StockMovement.objects.filter(stock_item=item).aggregate(v=Sum("value"))["v"] or 0
            item.avg_unit_cost = value / item.on_hand_qty if item.on_hand_qty else 0
            item.save()
            if lot:
                lot.remaining_qty -= m.qty_canonical
                lot.save()
        for m in MeterEntry.objects.filter(sub_event=s):
            machine = MachineDetail.objects.select_for_update().get(asset=m.machine)
            machine.meter_hours -= m.delta_hours
            machine.save()
            MeterEntry.objects.create(
                farm=ctx.farm,
                sub_event=rs,
                machine=m.machine,
                delta_hours=-m.delta_hours,
                reading_after=machine.meter_hours,
                occurred_at=m.occurred_at,
                reversal_of=m,
            )
        for m in LivingEntry.objects.filter(sub_event=s):
            living = LivingDetail.objects.select_for_update().get(asset=m.living_asset)
            if living.head_count - m.delta_count < 0:
                raise Conflict("Reverse dependent living movements first.")
            living.head_count -= m.delta_count
            living.save()
            LivingEntry.objects.create(
                farm=ctx.farm,
                sub_event=rs,
                living_asset=m.living_asset,
                delta_count=-m.delta_count,
                reason=reason,
                occurred_at=m.occurred_at,
                reversal_of=m,
            )
        for cost in CostRecord.objects.filter(sub_event=s):
            rc = CostRecord.objects.create(
                farm=ctx.farm,
                event=reverse,
                sub_event=rs,
                cost_nature=cost.cost_nature,
                basis_qty=-cost.basis_qty,
                basis_unit=cost.basis_unit,
                rate_used=cost.rate_used,
                amount=-cost.amount,
                rule=cost.rule,
                rule_version_no=cost.rule_version_no,
                occurred_on=cost.occurred_on,
                reversal_of=cost,
                is_imputed=cost.is_imputed,
            )
            for a in CostAllocation.objects.filter(cost_record=cost):
                CostAllocation.objects.create(
                    farm=ctx.farm,
                    cost_record=rc,
                    bucket=a.bucket,
                    crop_cycle=a.crop_cycle,
                    purpose_tag=a.purpose_tag,
                    event_target=a.event_target,
                    share_fraction=a.share_fraction,
                    amount=-a.amount,
                )
            for dep in DepreciationEntry.objects.filter(cost_record=cost):
                DepreciationEntry.objects.create(
                    farm=ctx.farm,
                    asset=dep.asset,
                    assignment=dep.assignment,
                    entry_date=dep.entry_date,
                    amount=-dep.amount,
                    basis_kind=dep.basis_kind,
                    basis_qty=-dep.basis_qty,
                    strategy_code=dep.strategy_code,
                    policy_version_no=dep.policy_version_no,
                    source_sub_event=rs,
                    cost_record=rc,
                    book_value_after=dep.book_value_after + dep.amount,
                    reversal_of=dep,
                )
        for entry in LedgerEntry.objects.filter(sub_event=s):
            LedgerEntry.objects.create(
                farm=ctx.farm,
                account=entry.account,
                entry_date=entry.entry_date,
                direction="out" if entry.direction == "in" else "in",
                amount=entry.amount,
                category=entry.category,
                counterparty=entry.counterparty,
                sub_event=rs,
                event=reverse,
                status=entry.status,
                client_uuid=uuid.uuid4(),
                reversal_of=entry,
                memo=reason,
            )
    for tr in TreatmentRecord.objects.filter(event=e):
        values = {
            f.name: getattr(tr, f.name)
            for f in tr._meta.fields
            if f.name
            not in (
                "id",
                "created_at",
                "updated_at",
                "created_by",
                "updated_by",
                "version",
                "event",
                "reversal_of",
                "qty_applied",
            )
        }
        TreatmentRecord.objects.create(**values, event=reverse, reversal_of=tr, qty_applied=-tr.qty_applied)
    # Safety windows remain conservative; an amended treatment must not silently release a field.
    corrected = create_event(ctx, replacement)
    corrected.status = "in_progress"
    corrected.save()
    return _confirm(ctx, corrected, {}, None)
