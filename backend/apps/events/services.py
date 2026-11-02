import uuid
from decimal import Decimal
from datetime import timedelta
from django.db.models import Q, Sum
from django.utils import timezone
from django.utils.dateparse import parse_datetime
from psycopg.types.range import Range
from rest_framework.exceptions import ValidationError, PermissionDenied
from apps.core.commands import command, digest, check_version, save_row
from apps.core.errors import Conflict
from apps.assets.models import Asset, StockItem, StockLot, MachineDetail, LivingDetail, PersonDetail
from apps.catalogue.models import Unit
from apps.scheduling.models import AvailabilityWindow, RestrictionWindow
from .models import (
    Event,
    EventType,
    EventTypeVersion,
    EventTypeLine,
    EventTarget,
    SubEvent,
    Reservation,
    StockMovement,
    MeterEntry,
    LivingEntry,
    ObservationDetail,
)
from .hooks import emit

D = Decimal
MONEY = D(".01")


def dt(value):
    value = parse_datetime(value) if isinstance(value, str) else value
    if not value or timezone.is_naive(value):
        raise ValidationError("An ISO 8601 timestamp with timezone is required.")
    return value


def own(ctx, model, pk, shared=False):
    q = model.objects.filter(pk=pk)
    q = q.filter(Q(farm=ctx.farm) | Q(farm__isnull=True)) if shared else q.filter(farm=ctx.farm)
    row = q.first()
    if not row:
        raise ValidationError("Unknown or cross-farm " + model.__name__)
    return row


def canonical(qty, unit, dimension=None):
    if dimension and unit.dimension != dimension:
        raise ValidationError("Incompatible quantity unit.")
    if unit.to_base_factor <= 0:
        raise ValidationError("Unit factor must be positive.")
    return (D(str(qty)) * unit.to_base_factor).quantize(D(".0001"))


def lock_assets(ctx, lines):
    ids = set(s.asset_id for s in lines) | set(
        s.capitalize_to_asset_id for s in lines if s.capitalize_to_asset_id
    )
    list(Asset.objects.select_for_update().filter(farm=ctx.farm, id__in=ids).order_by("id"))


def authorize_event(ctx, event, action):
    ctx.object(event, "record" if action != "view" else "view")
    if action in ("start", "submit") and not ctx.system and "events.event.plan" not in ctx.permissions:
        people = PersonDetail.objects.filter(farm=ctx.farm, user=ctx.user).values("asset_id")
        if (
            not SubEvent.objects.filter(event=event)
            .filter(Q(asset_id__in=people) | Q(operator_id__in=people))
            .exists()
        ):
            raise PermissionDenied("Only assigned workers may perform this command.")


def reserve(ctx, event, lines):
    lock_assets(ctx, lines)
    start, end = event.planned_start, event.planned_end
    if end <= start:
        raise ValidationError("End must be after start.")
    targets = list(EventTarget.objects.filter(event=event))
    for s in lines:
        if s.asset.status != "active":
            raise Conflict("Asset is unavailable.")
        window = Range(s.planned_start, s.planned_end, "[)")
        if AvailabilityWindow.objects.filter(
            asset=s.asset, kind__in=["downtime", "leave", "maintenance"], window__overlap=window
        ).exists():
            raise Conflict("Asset downtime overlaps the event.")
        # Recurrences are rejected at configuration time until expanded into explicit windows.
        if s.kind == "use_labour":
            shifts = AvailabilityWindow.objects.filter(asset=s.asset, kind="shift")
            if shifts.exists():
                shift = shifts.filter(window__contains=window).first()
                if not shift:
                    raise Conflict("Work falls outside the person shift.")
                occupied = Reservation.objects.filter(
                    asset=s.asset, status="active", window__overlap=window
                ).exclude(sub_event__event=event).aggregate(v=Sum("qty_reserved"))["v"] or D(0)
                if occupied + canonical(s.planned_qty, s.qty_unit, "time") > shift.capacity_hours:
                    raise Conflict("Shift capacity exceeded.")
        restrictions = RestrictionWindow.objects.filter(farm=ctx.farm, window__overlap=window).filter(
            Q(asset=s.asset) | Q(block_id__in=[t.block_id for t in targets if t.block_id])
        )
        relevant = ["reentry"]
        category = event.event_type.category.behavior_code
        if category == "crop_protection":
            relevant.append("no_spray")
        if category == "harvest":
            relevant.append("no_harvest")
        if restrictions.filter(restriction_kind__in=relevant).exists():
            raise Conflict("Safety restriction overlaps the event.")
        if s.kind in ("consume_stock", "transfer_stock"):
            stock = StockItem.objects.get(asset=s.asset)
            reserved = Reservation.objects.filter(asset=s.asset, status="active").exclude(
                sub_event__event=event
            ).aggregate(v=Sum("qty_reserved"))["v"] or D(0)
            same = sum(
                canonical(x.planned_qty, x.qty_unit, stock.base_unit.dimension)
                for x in lines
                if x.asset_id == s.asset_id and x.kind in ("consume_stock", "transfer_stock")
            )
            if stock.on_hand_qty - reserved < same:
                raise Conflict("Insufficient unreserved stock.")
        mode = "exclusive" if s.kind in ("use_machine", "use_labour") else "shared"
        if (
            mode == "exclusive"
            and Reservation.objects.filter(
                asset=s.asset, status="active", mode="exclusive", window__overlap=window
            )
            .exclude(sub_event__event=event)
            .exists()
        ):
            raise Conflict("Asset already reserved.")
        Reservation.objects.create(
            farm=ctx.farm,
            sub_event=s,
            asset=s.asset,
            mode=mode,
            window=window,
            qty_reserved=canonical(s.planned_qty, s.qty_unit),
        )
        s.status = "reserved"
        s.save()


@command("events.event.plan")
def create_event(ctx, data):
    data = dict(data)
    key = uuid.UUID(str(data["client_uuid"]))
    # Serialize create/retry on the farm root; protects the unique-key race.
    type(ctx.farm).objects.select_for_update().get(pk=ctx.farm.pk)
    old = Event.objects.filter(farm=ctx.farm, client_uuid=key).first()
    fingerprint = digest(data)
    if old:
        if old.request_hash != fingerprint:
            raise Conflict("Idempotency key was used with different content.")
        return old
    typ = own(ctx, EventType, data["event_type"], True)
    version = EventTypeVersion.objects.get(event_type=typ, version_no=typ.current_version_no)
    start = dt(data["planned_start"])
    end = dt(data.get("planned_end", start + timedelta(minutes=typ.default_duration_minutes)))
    if not typ.is_active or end <= start:
        raise ValidationError("Inactive type or invalid time window.")
    draft = bool(data.get("draft", False))
    event = Event.objects.create(
        farm=ctx.farm,
        event_type=typ,
        event_type_version=version,
        title=data.get("title", typ.name),
        status="draft",
        planned_start=start,
        planned_end=end,
        trigger_kind=data.get("trigger_kind", "manual"),
        scenario_ref=data.get("scenario_ref"),
        calendar_item_ref=data.get("calendar_item_ref"),
        client_uuid=key,
        created_by=ctx.user,
        request_hash=fingerprint,
        notes=data.get("notes", ""),
    )
    targets = data.get("targets", [])
    if not typ.allows_multiple_targets and len(targets) > 1:
        raise ValidationError("Multiple targets not allowed.")
    if typ.category.requires_crop_target and not any(t.get("crop_cycle") for t in targets):
        raise ValidationError("Crop target required.")
    total_area = D(0)
    made = []
    from apps.land.models import CropCycle, Block, CropCycleBlock

    for target in targets:
        target = dict(target)
        cycle = own(ctx, CropCycle, target["crop_cycle"]) if target.get("crop_cycle") else None
        block = own(ctx, Block, target["block"]) if target.get("block") else None
        asset = own(ctx, Asset, target["asset"]) if target.get("asset") else None
        if (
            cycle
            and cycle.status in ("closed", "abandoned")
            and typ.category.behavior_code not in ("sales", "stock_adjustment")
        ):
            raise Conflict("Closed cycles only accept sales and adjustments.")
        if cycle and block and not CropCycleBlock.objects.filter(crop_cycle=cycle, block=block).exists():
            raise ValidationError("Block is not attached to cycle.")
        if block:
            ctx.blocks([block.pk], "record")
        elif cycle:
            ctx.object(cycle, "record")
        elif ctx.allowed_blocks("record") is not None:
            raise PermissionDenied("A scoped event requires a block or crop cycle.")
        unit = own(ctx, Unit, target["area_unit"], True) if target.get("area_unit") else None
        area = D(str(target.get("area_value", 0)))
        m2 = canonical(area, unit, "area") if unit else D(0)
        if m2 < 0 or (block and m2 > block.area_m2):
            raise ValidationError("Invalid target area.")
        t = EventTarget.objects.create(
            farm=ctx.farm,
            event=event,
            crop_cycle=cycle,
            block=block,
            asset=asset,
            area_value=area,
            area_unit=unit,
            area_m2=m2,
            share_fraction=0,
        )
        made.append(t)
        total_area += m2
    for t in made:
        t.share_fraction = t.area_m2 / total_area if total_area else D(1) / len(made)
        t.save()
    supplied = data.get("lines")
    templates = list(EventTypeLine.objects.filter(event_type_version=version).order_by("line_no"))
    if supplied is None:
        supplied = []
        for line in templates:
            if not line.default_asset_id:
                raise ValidationError("Template requires an asset for line " + str(line.line_no))
            qty = line.default_qty
            if line.quantity_basis == "per_area":
                qty *= total_area  # per canonical square metre
            elif line.quantity_basis not in ("fixed", "per_area"):
                raise ValidationError(
                    "Supply computed quantity for derived/per-head/per-machine-hour template lines."
                )
            supplied.append(
                {
                    "line_no": line.line_no,
                    "kind": line.sub_event_kind,
                    "asset": str(line.default_asset_id),
                    "qty_unit": str(line.qty_unit_id),
                    "planned_qty": str(qty),
                    "purpose_tag": str(line.purpose_tag_id) if line.purpose_tag_id else None,
                }
            )
    template_map = {x.line_no: x for x in templates}
    numbers = {int(x.get("line_no", i + 1)) for i, x in enumerate(supplied)}
    if any(x.is_required and x.line_no not in numbers for x in templates):
        raise ValidationError("Required template line missing.")
    lines = []
    for i, line in enumerate(supplied):
        line = dict(line)
        number = int(line.get("line_no", i + 1))
        template = template_map.get(number)
        kind = line["kind"]
        if kind in ("pay", "receive"):
            ctx.require("ledger.entry.create")
        if kind == "asset_status":
            ctx.require("assets.asset.update")
        if line.get("capitalize_to_asset"):
            ctx.require("costing.depreciation.manage")
        asset = own(ctx, Asset, line["asset"])
        unit = own(ctx, Unit, line["qty_unit"], True)
        if kind in ("accrue",) and not ctx.system:
            raise PermissionDenied("System operation only.")
        if kind not in typ.category.allowed_sub_event_kinds:
            raise ValidationError("Sub-event kind not allowed by category.")
        if template and template.is_locked:
            if (
                kind != template.sub_event_kind
                or (template.default_asset_id and str(template.default_asset_id) != str(asset.pk))
                or str(unit.pk) != str(template.qty_unit_id)
            ):
                raise ValidationError("Locked template line changed.")
        if template and template.asset_class and template.asset_class != asset.asset_class:
            raise ValidationError("Wrong asset class for template.")
        expected = {
            "use_machine": "machine",
            "use_labour": "person",
            "occupy_space": "space",
            "consume_stock": "stock",
            "produce_stock": "stock",
            "transfer_stock": "stock",
            "adjust_stock": "stock",
            "acquire_stock": "stock",
            "living_gain": "living",
            "living_loss": "living",
        }
        if kind in expected and asset.asset_class != expected[kind]:
            raise ValidationError("Wrong asset class for kind.")
        qty = D(str(line.get("planned_qty", 0)))
        if qty < 0 and kind != "adjust_stock":
            raise ValidationError("Negative quantity.")
        s = SubEvent(
            farm=ctx.farm,
            event=event,
            line_no=number,
            kind=kind,
            asset=asset,
            qty_unit=unit,
            planned_qty=qty,
            planned_start=start,
            planned_end=end,
            client_uuid=line.get("client_uuid", uuid.uuid4()),
            unit_price=D(str(line.get("unit_price", 0))),
            amount=D(str(line.get("amount", 0))),
            notes=line.get("notes", ""),
            is_locked=bool(template and template.is_locked),
            is_required=bool(template and template.is_required),
            capital_terms=line.get("capital_terms", {}),
            account_id=line.get("account_id"),
            ledger_category_id=line.get("ledger_category_id"),
            expiry_date=line.get("expiry_date"),
            new_asset_status=line.get("new_asset_status", ""),
        )
        for field, model in [
            ("purpose_tag", "catalogue.PurposeTag"),
            ("counterparty", "catalogue.Counterparty"),
            ("stock_lot", "assets.StockLot"),
            ("destination", "assets.Asset"),
            ("grade", "catalogue.ProduceGrade"),
            ("operator", "assets.Asset"),
            ("capitalize_to_asset", "assets.Asset"),
        ]:
            if line.get(field):
                from django.apps import apps

                setattr(
                    s, field, own(ctx, apps.get_model(model), line[field], field in ("purpose_tag", "grade"))
                )
        save_row(s)
        lines.append(s)
    emit("estimate", ctx, event, lines)
    if not draft:
        reserve(ctx, event, lines)
        event.status = "planned"
    event.save()
    return event


@command("events.event.plan")
def plan_event(ctx, event_id, version):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "plan")
    check_version(e, version)
    if e.status != "draft":
        raise Conflict("Only draft events can be planned.")
    reserve(ctx, e, list(SubEvent.objects.filter(event=e)))
    e.status = "planned"
    e.version += 1
    e.save()
    return e


@command("events.event.reschedule")
def reschedule_event(ctx, event_id, start, end, version):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "plan")
    check_version(e, version)
    if e.status not in ("draft", "planned"):
        raise Conflict("Event cannot be rescheduled.")
    lines = list(SubEvent.objects.filter(event=e))
    lock_assets(ctx, lines)
    Reservation.objects.filter(sub_event__event=e, status="active").update(status="released")
    e.planned_start = dt(start)
    e.planned_end = dt(end)
    for s in lines:
        s.planned_start = e.planned_start
        s.planned_end = e.planned_end
        s.save()
    if e.status == "planned":
        reserve(ctx, e, lines)
    e.version += 1
    e.save()
    return e


@command("events.event.cancel")
def cancel_event(ctx, event_id, version):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "plan")
    check_version(e, version)
    if e.status not in ("draft", "planned", "in_progress"):
        raise Conflict("Event cannot be cancelled.")
    lines = list(SubEvent.objects.filter(event=e))
    lock_assets(ctx, lines)
    if any(s.status == "done" for s in lines):
        raise Conflict("Completed lines cannot be cancelled.")
    Reservation.objects.filter(sub_event__event=e, status="active").update(status="cancelled")
    SubEvent.objects.filter(event=e).update(status="cancelled")
    e.status = "cancelled"
    e.version += 1
    e.save()
    return e


@command("events.event.start")
def start_event(ctx, event_id, version):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "start")
    check_version(e, version)
    if e.status != "planned":
        raise Conflict("Only planned events can start.")
    e.status = "in_progress"
    e.actual_start = timezone.now()
    e.version += 1
    e.save()
    SubEvent.objects.filter(event=e).update(status="in_use", actual_start=e.actual_start)
    return e


def apply_actuals(e, corrections):
    lines = list(SubEvent.objects.filter(event=e).select_related("asset", "qty_unit").order_by("line_no"))
    by_id = {str(s.pk): s for s in lines}
    for key, values in corrections.items():
        if key not in by_id:
            raise ValidationError("Unknown sub-event correction.")
        if set(values) - {"actual_qty", "actual_start", "actual_end"}:
            raise ValidationError("Only actual quantity and times may be corrected.")
        s = by_id[key]
        if "actual_qty" in values:
            s.actual_qty = D(str(values["actual_qty"]))
        if "actual_start" in values:
            s.actual_start = dt(values["actual_start"])
        if "actual_end" in values:
            s.actual_end = dt(values["actual_end"])
    for s in lines:
        if s.actual_qty is None:
            s.actual_qty = s.planned_qty
        if s.actual_qty < 0 and s.kind != "adjust_stock":
            raise ValidationError("Negative quantity.")
        s.actual_start = s.actual_start or e.actual_start or e.planned_start
        s.actual_end = s.actual_end or e.actual_end or e.planned_end
        if s.actual_end < s.actual_start:
            raise ValidationError("Invalid actual window.")
        s.qty_canonical = canonical(s.actual_qty, s.qty_unit)
        s.save()
    return lines


@command("events.event.submit")
def submit_event(ctx, event_id, corrections, version):
    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "submit")
    check_version(e, version)
    if e.status != "in_progress":
        raise Conflict("Start the event before submitting actuals.")
    apply_actuals(e, corrections)
    e.submitted_by = ctx.user
    e.submitted_at = timezone.now()
    e.version += 1
    e.save()
    if not ctx.farm.require_supervisor_confirmation:
        return _confirm(ctx, e, {}, None)
    return e


def stock_effect(ctx, s):
    item = StockItem.objects.select_for_update().get(asset=s.asset)
    qty = canonical(s.actual_qty, s.qty_unit, item.base_unit.dimension)
    current_value = StockMovement.objects.filter(stock_item=item).aggregate(v=Sum("value"))["v"] or D(0)
    incoming = s.kind in ("acquire_stock", "produce_stock") or (s.kind == "adjust_stock" and qty >= 0)
    if incoming:
        if qty <= 0:
            return
        rate = (
            D(0)
            if s.kind == "produce_stock"
            else (
                s.unit_price / s.qty_unit.to_base_factor if s.kind == "acquire_stock" else item.avg_unit_cost
            )
        )
        value = (qty * rate).quantize(MONEY)
        new_total = item.on_hand_qty + qty
        item.avg_unit_cost = ((current_value + value) / new_total).quantize(D(".0001"))
        lot = StockLot.objects.create(
            farm=ctx.farm,
            stock_item=item,
            lot_code=str(s.pk),
            received_on=s.actual_end.date(),
            expiry_date=s.expiry_date,
            initial_qty=qty,
            remaining_qty=qty,
            unit_cost=rate,
            storage_location=s.destination,
            grade=s.grade,
            supplier=s.counterparty,
            source_sub_event_id=s.pk,
        )
        StockMovement.objects.create(
            farm=ctx.farm,
            sub_event=s,
            stock_item=item,
            lot=lot,
            movement_type="adjust_in" if s.kind == "adjust_stock" else "in",
            qty_canonical=qty,
            unit_cost=rate,
            value=value,
            occurred_at=s.actual_end,
        )
        item.on_hand_qty = new_total
    else:
        qty = abs(qty)
        if item.on_hand_qty < qty:
            raise Conflict("Insufficient stock; record an adjustment first.")
        lots = StockLot.objects.select_for_update().filter(stock_item=item, remaining_qty__gt=0)
        if s.stock_lot_id:
            lots = lots.filter(pk=s.stock_lot_id)
        lots = (
            lots.order_by("received_on", "id")
            if item.valuation_method == "FIFO"
            else lots.order_by("expiry_date", "received_on", "id")
        )
        left = qty
        consumed_value = D(0)
        for lot in lots:
            if left <= 0:
                break
            take = min(left, lot.remaining_qty)
            rate = lot.unit_cost if item.valuation_method == "FIFO" else item.avg_unit_cost
            out_value = (take * rate).quantize(MONEY)
            if take == left and qty == item.on_hand_qty:
                out_value = current_value - consumed_value
            consumed_value += out_value
            StockMovement.objects.create(
                farm=ctx.farm,
                sub_event=s,
                stock_item=item,
                lot=lot,
                movement_type="adjust_out" if s.kind == "adjust_stock" else "out",
                qty_canonical=-take,
                unit_cost=rate,
                value=-out_value,
                occurred_at=s.actual_end,
            )
            lot.remaining_qty -= take
            lot.save()
            left -= take
        if left:
            raise Conflict("Selected lots do not contain sufficient stock.")
        item.on_hand_qty -= qty
        if not item.on_hand_qty:
            item.avg_unit_cost = 0
        if s.kind == "transfer_stock" and s.destination_id:
            # Internal transfer preserves both quantity and acquisition basis in a new location lot.
            movements = list(StockMovement.objects.filter(sub_event=s))
            for m in movements:
                lot = StockLot.objects.create(
                    farm=ctx.farm,
                    stock_item=item,
                    lot_code=str(uuid.uuid4()),
                    received_on=s.actual_end.date(),
                    expiry_date=m.lot.expiry_date,
                    initial_qty=-m.qty_canonical,
                    remaining_qty=-m.qty_canonical,
                    unit_cost=m.unit_cost,
                    storage_location=s.destination,
                    source_sub_event_id=s.pk,
                )
                StockMovement.objects.create(
                    farm=ctx.farm,
                    sub_event=s,
                    stock_item=item,
                    lot=lot,
                    movement_type="in",
                    qty_canonical=-m.qty_canonical,
                    unit_cost=m.unit_cost,
                    value=-m.value,
                    occurred_at=s.actual_end,
                )
            item.on_hand_qty += qty
            if movements:
                item.avg_unit_cost = movements[0].unit_cost
    value_after = StockMovement.objects.filter(stock_item=item).aggregate(v=Sum("value"))["v"] or D(0)
    item.avg_unit_cost = (value_after / item.on_hand_qty).quantize(D(".0001")) if item.on_hand_qty else D(0)
    item.save()


def _confirm(ctx, e, corrections, override_reason):
    if e.status == "done":
        return e
    if e.status != "in_progress":
        raise Conflict("Start the event before confirmation.")
    lines = apply_actuals(e, corrections)
    lock_assets(ctx, lines)
    emit("validate", ctx, e, lines, override_reason=override_reason)
    for s in lines:
        if s.kind in ("consume_stock", "produce_stock", "acquire_stock", "transfer_stock", "adjust_stock"):
            stock_effect(ctx, s)
        elif s.kind == "use_machine":
            qty = canonical(s.actual_qty, s.qty_unit, "time")
            m = MachineDetail.objects.select_for_update().get(asset=s.asset)
            m.meter_hours += qty
            m.save()
            MeterEntry.objects.create(
                farm=ctx.farm,
                sub_event=s,
                machine=s.asset,
                delta_hours=qty,
                reading_after=m.meter_hours,
                occurred_at=s.actual_end,
            )
        elif s.kind == "use_labour":
            canonical(s.actual_qty, s.qty_unit, "time")
        elif s.kind in ("living_gain", "living_loss"):
            qty = canonical(s.actual_qty, s.qty_unit, "count") * (1 if s.kind == "living_gain" else -1)
            living = LivingDetail.objects.select_for_update().get(asset=s.asset)
            if living.head_count + qty < 0:
                raise Conflict("Head count would become negative.")
            living.head_count += qty
            living.save()
            LivingEntry.objects.create(
                farm=ctx.farm,
                sub_event=s,
                living_asset=s.asset,
                delta_count=qty,
                reason=s.notes,
                occurred_at=s.actual_end,
            )
        elif s.kind == "asset_status":
            if s.new_asset_status not in ("active", "maintenance", "retired"):
                raise ValidationError("Invalid new asset status.")
            Asset.objects.filter(pk=s.asset_id).update(
                status=s.new_asset_status,
                retired_on=s.actual_end.date() if s.new_asset_status == "retired" else None,
            )
    for phase in ("cost", "ledger", "compliance", "science"):
        emit(phase, ctx, e, lines)
    Reservation.objects.filter(sub_event__event=e, status="active").update(status="converted")
    for s in lines:
        s.status = "done"
        s.save()
    e.status = "done"
    e.confirmed_by = ctx.user
    e.confirmed_at = timezone.now()
    e.actual_end = max((s.actual_end for s in lines), default=timezone.now())
    e.version += 1
    e.save()
    emit("finish", ctx, e, lines)
    return e


@command("events.event.confirm")
def confirm_event(ctx, event_id, corrections=None, version=None, override_reason=None):
    from apps.core.models import CommandReceipt

    e = Event.objects.select_for_update().get(pk=event_id, farm=ctx.farm)
    authorize_event(ctx, e, "confirm")
    fingerprint = digest({"corrections": corrections or {}, "override_reason": override_reason})
    key = uuid.uuid5(e.client_uuid, "confirmation")
    receipt = CommandReceipt.objects.filter(
        farm=ctx.farm, client_uuid=key, command_name="confirm_event"
    ).first()
    if e.status == "done":
        if corrections and (not receipt or receipt.request_hash != fingerprint):
            raise Conflict("Event already confirmed with different actuals; use an amendment.")
        return e
    check_version(e, version)
    result = _confirm(ctx, e, corrections or {}, override_reason)
    CommandReceipt.objects.create(
        farm=ctx.farm,
        client_uuid=key,
        command_name="confirm_event",
        request_hash=fingerprint,
        result={"event_id": str(e.pk)},
    )
    return result


@command("events.observation.create")
def record_observation(ctx, data):
    # Observation-only permission is enough; do not grant event planning to workers.
    original = ctx.permissions
    ctx.permissions = set(original) | {"events.event.plan"}
    try:
        e = create_event(ctx, data)
    finally:
        ctx.permissions = original
    if e.event_type.category.behavior_code != "observation":
        raise ValidationError("Observation event type required.")
    detail = data.get("observation", {})
    existing = ObservationDetail.objects.filter(event=e).first()
    if existing:
        return e
    allowed = {
        "observation_kind",
        "severity",
        "metric_name",
        "metric_value",
        "metric_unit",
        "stage_code",
        "location_note",
        "geotag",
        "follow_up_of_id",
    }
    if set(detail) - allowed:
        raise ValidationError("Unknown observation fields.")
    detail = ObservationDetail(farm=ctx.farm, event=e, client_uuid=e.client_uuid, **detail)
    save_row(detail)
    e.status = "in_progress"
    e.save()
    return _confirm(ctx, e, {}, None)


@command("events.stock.adjust")
def adjust_stock(ctx, data):
    original = ctx.permissions
    ctx.permissions = set(original) | {"events.event.plan"}
    try:
        e = create_event(ctx, data)
    finally:
        ctx.permissions = original
    if e.event_type.category.behavior_code != "stock_adjustment":
        raise ValidationError("Stock adjustment category required.")
    if e.status == "done":
        return e
    e.status = "in_progress"
    e.save()
    return _confirm(ctx, e, {}, None)
