import calendar
from decimal import Decimal
from datetime import timedelta, datetime, time
from zoneinfo import ZoneInfo
import uuid
from django.db.models import Sum, Q
from django.utils import timezone
from rest_framework.exceptions import ValidationError
from apps.core.commands import command
from apps.core.errors import Conflict
from apps.events.models import EventTarget, StockMovement, EventType
from apps.assets.models import Asset, StockItem, Tenure, SpaceDetail, PersonDetail
from .models import (
    AssetCostRuleAssignment,
    PrepaidEntry,
    CostRecord,
    CostAllocation,
    EventCostSummary,
    AssetCapitalProfile,
    DepreciationPolicy,
    AssetDepreciationAssignment,
    DepreciationEntry,
    HoldingAccrualRun,
    ReconciliationRun,
)
from .arithmetic import money, allocate

D = Decimal


def effective(q, date):
    return q.filter(effective_from__lte=date).filter(Q(effective_to__isnull=True) | Q(effective_to__gt=date))


def rate_for(s, date):
    assignment = (
        effective(
            AssetCostRuleAssignment.objects.filter(asset=s.asset, role="use").select_related("cost_rule"),
            date,
        )
        .order_by("-effective_from")
        .first()
    )
    if assignment:
        r = assignment.cost_rule
        if not r.is_active or r.effective_from > date or (r.effective_to and r.effective_to <= date):
            raise ValidationError("Cost rule is not effective on event date.")
        rate = D(str(r.params.get("rate", 0)))
        if r.rule_type == "flow_estimate":
            rate *= D(str(r.params.get("flow_rate", 0)))
        return rate, r
    if s.kind == "use_labour":
        person = PersonDetail.objects.get(asset=s.asset)
        if not person.is_paid:
            return s.farm.imputed_labour_rate, None
    return D(0), None


def record(ctx, e, s, nature, amount, rate=0, rule=None, bucket="operation", targets=None, is_imputed=False):
    amount = money(amount)
    if not amount:
        return None
    row = CostRecord.objects.create(
        farm=ctx.farm,
        sub_event=s,
        event=e,
        cost_nature=nature,
        basis_qty=s.qty_canonical,
        basis_unit=s.qty_unit,
        rate_used=rate,
        amount=amount,
        rule=rule,
        rule_version_no=rule.version_no if rule else None,
        occurred_on=s.actual_end.astimezone(ZoneInfo(ctx.farm.timezone)).date(),
        is_imputed=is_imputed,
    )
    targets = list(EventTarget.objects.filter(event=e)) if targets is None else targets
    if not targets:
        CostAllocation.objects.create(
            farm=ctx.farm,
            cost_record=row,
            bucket="idle" if bucket == "holding" else "overhead",
            amount=amount,
            share_fraction=1,
            purpose_tag=s.purpose_tag,
        )
    else:
        weights = [t.share_fraction for t in targets]
        parts = allocate(amount, weights)
        total = sum(weights) or len(weights)
        for t, part in zip(targets, parts):
            CostAllocation.objects.create(
                farm=ctx.farm,
                cost_record=row,
                bucket=bucket,
                crop_cycle=t.crop_cycle,
                event_target=t,
                purpose_tag=s.purpose_tag,
                share_fraction=t.share_fraction / total,
                amount=part,
            )
    if sum(CostAllocation.objects.filter(cost_record=row).values_list("amount", flat=True)) != row.amount:
        raise Conflict("Allocation conservation failed.")
    return row


def book_value(profile, date=None):
    q = DepreciationEntry.objects.filter(asset=profile.asset)
    if date:
        q = q.filter(entry_date__lte=date)
    return (
        profile.acquisition_cost
        + profile.capital_additions_total
        - (q.aggregate(v=Sum("amount"))["v"] or D(0))
    )


def depreciate(ctx, e, s, timing="use"):
    profile = AssetCapitalProfile.objects.filter(asset=s.asset).first()
    if not profile:
        return
    date = s.actual_end.astimezone(ZoneInfo(ctx.farm.timezone)).date()
    assignment = effective(
        AssetDepreciationAssignment.objects.filter(asset=s.asset).select_related("policy"), date
    ).first()
    if not assignment:
        return
    strategy = assignment.policy.strategy_code
    if (strategy == "units_of_production_hours") != (timing == "use"):
        return
    qty = s.qty_canonical if timing == "use" else D(1)
    life = assignment.remaining_life_hours if timing == "use" else assignment.remaining_life_years * 365
    if life <= 0:
        raise ValidationError("Depreciation life must be positive.")
    current = book_value(profile)
    base = assignment.base_book_value - profile.salvage_value
    amount = min(max(D(0), current - profile.salvage_value), money(base / life * qty))
    cost = record(
        ctx, e, s, "depreciation", amount, base / life, bucket="operation" if timing == "use" else "holding"
    )
    if cost:
        DepreciationEntry.objects.create(
            farm=ctx.farm,
            asset=s.asset,
            assignment=assignment,
            entry_date=date,
            amount=amount,
            basis_kind="hours" if timing == "use" else "days",
            basis_qty=qty,
            strategy_code=strategy,
            policy_version_no=assignment.policy.version_no,
            source_sub_event=s,
            cost_record=cost,
            book_value_after=current - amount,
        )


def estimate(ctx, e, lines):
    total = D(0)
    for s in lines:
        qty = s.planned_qty * s.qty_unit.to_base_factor
        if s.kind in ("consume_stock", "transfer_stock"):
            item = StockItem.objects.get(asset=s.asset)
            total += qty * item.avg_unit_cost
        elif s.kind in ("use_machine", "use_labour"):
            rate, rule = rate_for(s, e.planned_start.date())
            total += rate if rule and rule.rule_type == "fixed_per_event" else qty * rate
    e.planned_cost_total = money(total)


def cost_handler(ctx, e, lines):
    for s in lines:
        date = s.actual_end.astimezone(ZoneInfo(ctx.farm.timezone)).date()
        if s.kind in ("consume_stock", "transfer_stock", "adjust_stock"):
            if s.kind == "transfer_stock" and s.destination_id:
                continue
            value = -(StockMovement.objects.filter(sub_event=s).aggregate(v=Sum("value"))["v"] or D(0))
            if value:
                record(
                    ctx,
                    e,
                    s,
                    "loss" if s.kind == "adjust_stock" else "consumption",
                    value,
                    abs(value / s.qty_canonical) if s.qty_canonical else 0,
                )
        elif s.kind in ("use_machine", "use_labour"):
            rate, rule = rate_for(s, date)
            amount = rate if rule and rule.rule_type == "fixed_per_event" else s.qty_canonical * rate
            record(
                ctx,
                e,
                s,
                "machine_use" if s.kind == "use_machine" else "labour",
                amount,
                rate,
                rule,
                is_imputed=s.kind == "use_labour" and not PersonDetail.objects.get(asset=s.asset).is_paid,
            )
            if s.kind == "use_machine":
                depreciate(ctx, e, s)
        elif s.kind == "accrue":
            record(ctx, e, s, "holding", s.amount, s.amount, bucket="holding")
            if s.amount:
                prepaid = PrepaidEntry.objects.filter(asset=s.asset).aggregate(v=Sum("amount"))["v"] or D(0)
                if prepaid >= s.amount:
                    PrepaidEntry.objects.create(
                        farm=ctx.farm, asset=s.asset, sub_event=s, amount=-s.amount, entry_date=date
                    )
            depreciate(ctx, e, s, "daily")
    summarise_event(ctx, e)


def summarise_event(ctx, e):
    rows = CostRecord.objects.filter(event=e)
    total = rows.aggregate(v=Sum("amount"))["v"] or D(0)
    area = EventTarget.objects.filter(event=e).aggregate(v=Sum("area_m2"))["v"] or D(0)
    breakdown = {r["cost_nature"]: str(r["v"]) for r in rows.values("cost_nature").annotate(v=Sum("amount"))}
    EventCostSummary.objects.update_or_create(
        farm=ctx.farm,
        event=e,
        defaults={
            "planned_total": e.planned_cost_total,
            "actual_total": total,
            "cost_per_area": total / area if area else 0,
            "variance": total - e.planned_cost_total,
            "breakdown": breakdown,
        },
    )
    e.actual_cost_total = total


@command("costing.depreciation.manage")
def change_depreciation_policy(
    ctx,
    asset_id,
    policy_id,
    effective_date,
    reason="",
    remaining_life_hours=None,
    remaining_life_years=None,
    preview=False,
):
    asset = Asset.objects.select_for_update().get(pk=asset_id, farm=ctx.farm)
    profile = AssetCapitalProfile.objects.get(asset=asset, farm=ctx.farm)
    policy = DepreciationPolicy.objects.filter(Q(farm=ctx.farm) | Q(farm__isnull=True)).get(pk=policy_id)
    latest = DepreciationEntry.objects.filter(asset=asset).order_by("-entry_date").first()
    if latest and effective_date <= latest.entry_date:
        raise Conflict("Effective date must follow the latest confirmed depreciation entry.")
    current = effective(AssetDepreciationAssignment.objects.filter(asset=asset), effective_date).first()
    hours = remaining_life_hours
    years = remaining_life_years
    if hours is None:
        hours = max(
            D(0),
            profile.expected_life_hours
            - (
                DepreciationEntry.objects.filter(asset=asset, basis_kind="hours").aggregate(
                    v=Sum("basis_qty")
                )["v"]
                or 0
            ),
        )
    if years is None:
        years = max(
            D(0), profile.expected_life_years - D((effective_date - profile.in_service_date).days) / 365
        )
    value = book_value(profile)
    life = D(hours) if policy.strategy_code == "units_of_production_hours" else D(years) * 365
    if life <= 0:
        raise ValidationError("Remaining life must be positive.")
    result = {
        "book_value": str(value),
        "rate": str(money((value - profile.salvage_value) / life)),
        "strategy": policy.strategy_code,
    }
    if preview:
        return result
    if (remaining_life_hours is not None or remaining_life_years is not None) and not reason:
        raise ValidationError("Life override requires a reason.")
    if current:
        if current.effective_from >= effective_date:
            raise Conflict("An assignment already starts on this date.")
        current.effective_to = effective_date
        current.save()
    return AssetDepreciationAssignment.objects.create(
        farm=ctx.farm,
        asset=asset,
        policy=policy,
        effective_from=effective_date,
        base_book_value=value,
        remaining_life_hours=hours,
        remaining_life_years=years,
        reason=reason,
        created_by=ctx.user,
    )


@command("costing.cost.manage")
def run_holding_accrual(ctx, date):
    from apps.events.services import create_event, _confirm
    from apps.land.models import CropCycleBlock

    type(ctx.farm).objects.select_for_update().get(pk=ctx.farm.pk)
    prior = HoldingAccrualRun.objects.filter(farm=ctx.farm, accrual_date=date).first()
    if prior:
        return prior
    run = HoldingAccrualRun.objects.create(
        farm=ctx.farm, accrual_date=date, status="running", started_at=timezone.now()
    )
    typ = EventType.objects.get(farm__isnull=True, code="system_accrual")
    from apps.catalogue.models import Unit

    unit = Unit.objects.get(farm__isnull=True, code="hour")
    start = datetime.combine(date, time(0), tzinfo=ZoneInfo(ctx.farm.timezone))
    end = start + timedelta(days=1)
    assets = set(
        Tenure.objects.filter(farm=ctx.farm, tenure_kind="leased_in", start_date__lte=date)
        .filter(Q(end_date__isnull=True) | Q(end_date__gte=date))
        .values_list("asset_id", flat=True)
    )
    assets.update(
        effective(
            AssetDepreciationAssignment.objects.filter(
                farm=ctx.farm, policy__strategy_code="straight_line_daily"
            ),
            date,
        ).values_list("asset_id", flat=True)
    )
    for asset_id in sorted(assets):
        amount = D(0)
        for tenure in Tenure.objects.filter(
            farm=ctx.farm, asset_id=asset_id, tenure_kind="leased_in", start_date__lte=date
        ).filter(Q(end_date__isnull=True) | Q(end_date__gte=date)):
            days = {
                "day": 1,
                "month": calendar.monthrange(date.year, date.month)[1],
                "year": 366 if calendar.isleap(date.year) else 365,
                "season": (tenure.end_date - tenure.start_date).days + 1 if tenure.end_date else 0,
            }[tenure.rent_period]
            if not days:
                raise ValidationError("Season rent requires an end date.")
            amount += tenure.rent_amount / days
        targets = []
        space = SpaceDetail.objects.filter(asset_id=asset_id).first()
        if space and space.block_id:
            for cb in CropCycleBlock.objects.filter(
                block_id=space.block_id,
                crop_cycle__status__in=["planned", "active", "harvesting"],
                crop_cycle__planned_sowing_date__lte=date,
                crop_cycle__expected_harvest_end__gte=date,
            ):
                targets.append(
                    {
                        "crop_cycle": str(cb.crop_cycle_id),
                        "block": str(cb.block_id),
                        "area_value": str(cb.area_value),
                        "area_unit": str(cb.area_unit_id),
                    }
                )
        e = create_event(
            ctx,
            {
                "event_type": str(typ.pk),
                "client_uuid": str(uuid.uuid5(ctx.farm.pk, f"accrual:{date}:{asset_id}")),
                "planned_start": start.isoformat(),
                "planned_end": (end - timedelta(microseconds=1)).isoformat(),
                "draft": True,
                "trigger_kind": "system",
                "targets": targets,
                "lines": [
                    {
                        "kind": "accrue",
                        "asset": str(asset_id),
                        "qty_unit": str(unit.pk),
                        "planned_qty": "1",
                        "amount": str(money(amount)),
                    }
                ],
            },
        )
        e.status = "in_progress"
        e.save()
        _confirm(ctx, e, {}, None)
        run.rows_created += 1
    run.status = "done"
    run.finished_at = timezone.now()
    run.save()
    return run


def register_value(ctx, date):
    value = D(0)
    for item in StockItem.objects.filter(farm=ctx.farm):
        stock = StockMovement.objects.filter(stock_item=item, occurred_at__date__lte=date).aggregate(
            v=Sum("value")
        )["v"] or D(0)
        value += stock
    for p in AssetCapitalProfile.objects.filter(farm=ctx.farm, in_service_date__lte=date):
        value += book_value(p, date)
    value += PrepaidEntry.objects.filter(farm=ctx.farm, entry_date__lte=date).aggregate(v=Sum("amount"))[
        "v"
    ] or D(0)
    return money(value)


@command("costing.cost.manage")
def run_reconciliation(ctx, start, end):
    from apps.ledger.models import LedgerEntry

    q = LedgerEntry.objects.filter(
        farm=ctx.farm,
        entry_date__range=(start, end),
        category__kind__in=["asset_purchase", "operating_payment"],
    )
    cash = sum((r.amount if r.direction == "out" else -r.amount for r in q), D(0))
    delta = register_value(ctx, end) - register_value(ctx, start - timedelta(days=1))
    cost = CostRecord.objects.filter(
        farm=ctx.farm, occurred_on__range=(start, end), is_imputed=False
    ).aggregate(v=Sum("amount"))["v"] or D(0)
    difference = money(cash - delta - cost)
    return ReconciliationRun.objects.create(
        farm=ctx.farm,
        period_start=start,
        period_end=end,
        cash_spent_on_assets=cash,
        change_in_register_value=delta,
        cost_recognised=cost,
        difference=difference,
        status="balanced" if abs(difference) <= D(".01") else "off",
        tolerance=D(".01"),
        details={
            "scope": "Stock, depreciable capital and prepaid balances; unpaid credit and imputed labour excluded from cash identity."
        },
        run_at=timezone.now(),
    )
