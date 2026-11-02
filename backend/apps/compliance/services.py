from datetime import timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo
from django.db.models import Q
from django.utils import timezone
from psycopg.types.range import Range
from rest_framework.exceptions import ValidationError
from apps.events.models import EventTarget, StockMovement, EventExecution
from apps.assets.models import StockItem, StockLot
from apps.catalogue.models import ProductCropLabel
from apps.scheduling.models import RestrictionWindow
from .models import ComplianceCheck, ComplianceOverride, TreatmentRecord

D = Decimal


def check(ctx, e, s, code, blocked, message, override_reason=None, warn=False):
    row = ComplianceCheck.objects.create(
        farm=ctx.farm,
        event=e,
        sub_event=s,
        check_code=code,
        result=("warn" if warn else "block") if blocked else "pass",
        message=message,
        evaluated_at=timezone.now(),
    )
    if blocked and not warn:
        if not override_reason:
            raise ValidationError({"compliance": message, "check_code": code})
        ctx.require("compliance.compliance.override")
        ComplianceOverride.objects.create(
            farm=ctx.farm, compliance_check=row, overridden_by=ctx.user, reason=override_reason
        )


def validate(ctx, e, lines, override_reason=None):
    targets = list(EventTarget.objects.filter(event=e))
    for s in lines:
        start = s.actual_start
        end = s.actual_end
        restrictions = RestrictionWindow.objects.filter(
            farm=ctx.farm, window__overlap=Range(start, end, "[)")
        ).filter(Q(asset=s.asset) | Q(block_id__in=[t.block_id for t in targets if t.block_id]))
        if e.event_type.category.behavior_code == "harvest":
            for t in targets:
                unsafe = TreatmentRecord.objects.filter(
                    farm=ctx.farm,
                    block=t.block,
                    waiting_period_ends_on__gt=end.date(),
                    reversal_of__isnull=True,
                ).exists()
                check(
                    ctx,
                    e,
                    s,
                    "waiting_period_conflict",
                    unsafe,
                    "Harvest waiting period has not ended.",
                    override_reason,
                )
        check(
            ctx,
            e,
            s,
            "reentry_conflict",
            restrictions.filter(restriction_kind="reentry").exists(),
            "Re-entry restriction is active.",
            override_reason,
        )
        if s.kind != "consume_stock":
            continue
        stock = StockItem.objects.select_related("product__category").get(asset=s.asset)
        lots = StockLot.objects.filter(stock_item=stock, remaining_qty__gt=0)
        if s.stock_lot_id:
            lots = lots.filter(pk=s.stock_lot_id)
        # Conservatively block if the FEFO pool contains an expired lot; select a valid lot explicitly to exclude it.
        check(
            ctx,
            e,
            s,
            "expired_lot",
            lots.filter(expiry_date__lt=end.date()).exists(),
            "An available selected lot is expired.",
            override_reason,
        )
        product = stock.product
        if not product or not product.category.is_regulated:
            continue
        if not targets:
            raise ValidationError("Regulated product needs crop and block targets.")
        for t in targets:
            if not t.crop_cycle_id or not t.block_id or t.area_m2 <= 0:
                raise ValidationError(
                    "Regulated use requires a crop cycle, block, and positive treated area."
                )
            label = ProductCropLabel.objects.filter(product=product, crop=t.crop_cycle.crop).first()
            if not label:
                raise ValidationError("Enter the product label for this crop before treatment.")
            if label.dose_unit.dimension != s.qty_unit.dimension:
                raise ValidationError("Label dose unit dimension mismatch.")
            dose = (s.qty_canonical * t.share_fraction / label.dose_unit.to_base_factor) / (
                t.area_m2 / label.per_area_unit.to_base_factor
            )
            past = TreatmentRecord.objects.filter(
                farm=ctx.farm, crop_cycle=t.crop_cycle, product=product, reversal_of__isnull=True
            )
            count = past.values("event_id").distinct().count()
            latest = past.order_by("-applied_at").first()
            check(
                ctx,
                e,
                s,
                "dose_outside_label",
                not label.dose_min <= dose <= label.dose_max,
                "Dose is outside the entered label range.",
                override_reason,
            )
            check(
                ctx,
                e,
                s,
                "max_applications_exceeded",
                label.max_applications_per_cycle is not None and count >= label.max_applications_per_cycle,
                "Maximum application count reached.",
                override_reason,
            )
            check(
                ctx,
                e,
                s,
                "minimum_interval_not_met",
                bool(latest and (end - latest.applied_at).total_seconds() < label.min_interval_days * 86400),
                "Minimum treatment interval not met.",
                override_reason,
            )
            previous = (
                TreatmentRecord.objects.filter(farm=ctx.farm, crop_cycle=t.crop_cycle)
                .order_by("-applied_at")
                .first()
            )
            check(
                ctx,
                e,
                s,
                "repeated_mode_of_action",
                bool(
                    previous
                    and product.mode_of_action_group
                    and previous.mode_of_action_group == product.mode_of_action_group
                ),
                "Repeated mode of action.",
                warn=True,
            )


def confirmed(ctx, e, lines):
    for s in lines:
        if s.kind != "consume_stock":
            continue
        item = StockItem.objects.select_related("product__category").get(asset=s.asset)
        if not item.product or not item.product.category.is_regulated:
            continue
        execution = EventExecution.objects.filter(event=e).first()
        for t in EventTarget.objects.filter(event=e):
            label = ProductCropLabel.objects.get(product=item.product, crop=t.crop_cycle.crop)
            reentry = s.actual_end + timedelta(hours=float(label.reentry_hours))
            for m in StockMovement.objects.filter(sub_event=s, qty_canonical__lt=0):
                qty = -m.qty_canonical * t.share_fraction
                TreatmentRecord.objects.create(
                    farm=ctx.farm,
                    event=e,
                    crop_cycle=t.crop_cycle,
                    block=t.block,
                    product=item.product,
                    stock_lot=m.lot,
                    qty_applied=qty / s.qty_unit.to_base_factor,
                    qty_unit=s.qty_unit,
                    area_covered_m2=t.area_m2,
                    dose_per_area=qty / t.area_m2,
                    applied_at=s.actual_end,
                    operator=s.operator or (execution.operator if execution else None),
                    weather_note=execution.weather_note if execution else "",
                    mode_of_action_group=item.product.mode_of_action_group,
                    waiting_period_ends_on=s.actual_end.astimezone(ZoneInfo(ctx.farm.timezone)).date()
                    + timedelta(days=label.waiting_period_days),
                    reentry_ends_at=reentry,
                )
            if label.reentry_hours:
                RestrictionWindow.objects.create(
                    farm=ctx.farm,
                    block=t.block,
                    window=Range(s.actual_end, reentry, "[)"),
                    restriction_kind="reentry",
                    source_type="events.event",
                    source_id=e.pk,
                    reason="Product label re-entry interval",
                )
