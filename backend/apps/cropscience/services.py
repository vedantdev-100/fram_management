import operator
import uuid
from datetime import datetime, time, timedelta
from decimal import Decimal
from zoneinfo import ZoneInfo
from django.utils import timezone
from django.db.models import Q
from rest_framework.exceptions import ValidationError
from apps.core.commands import command
from apps.events.models import EventTarget, ObservationDetail, Event
from apps.events.services import create_event, reschedule_event
from apps.land.models import CropCycle, CropCycleBlock
from apps.costing.arithmetic import gdd
from .models import (
    ThresholdRule,
    Suggestion,
    CropStageRecord,
    CropStage,
    CalendarTemplate,
    CalendarTemplateItem,
    CropCycleCalendar,
    WeatherDaily,
    GddDaily,
)


def science_handler(ctx, e, lines):
    targets = EventTarget.objects.filter(event=e, crop_cycle__isnull=False)
    category = e.event_type.category.behavior_code
    for target in targets:
        cycle = target.crop_cycle
        if category == "planting":
            cycle.status = "active"
            cycle.actual_sowing_date = (e.actual_start or e.planned_start).date()
            cycle.save()
        elif category == "harvest":
            cycle.status = "harvesting"
            cycle.save()
    obs = ObservationDetail.objects.filter(event=e).first()
    if not obs:
        return
    operations = {
        "gt": operator.gt,
        "gte": operator.ge,
        "lt": operator.lt,
        "lte": operator.le,
        "eq": operator.eq,
    }
    for t in targets:
        for rule in ThresholdRule.objects.filter(
            Q(farm=ctx.farm) | Q(farm__isnull=True),
            crop=t.crop_cycle.crop,
            observation_kind=obs.observation_kind,
            metric_name=obs.metric_name,
            is_active=True,
        ):
            if (
                obs.severity >= rule.severity_min
                and obs.metric_value is not None
                and operations[rule.operator](obs.metric_value, rule.threshold_value)
            ):
                Suggestion.objects.get_or_create(
                    farm=ctx.farm,
                    crop_cycle=t.crop_cycle,
                    source_event=e,
                    rule=rule,
                    defaults={"recommended_event_type": rule.recommended_event_type},
                )


def cycle_targets(cycle):
    return [
        {
            "crop_cycle": str(cycle.pk),
            "block": str(b.block_id),
            "area_value": str(b.area_value),
            "area_unit": str(b.area_unit_id),
        }
        for b in CropCycleBlock.objects.filter(crop_cycle=cycle)
    ]


@command("cropscience.science.manage")
def generate_calendar(ctx, cycle_id, template_id):
    cycle = CropCycle.objects.select_for_update().get(pk=cycle_id, farm=ctx.farm)
    ctx.object(cycle, "record")
    template = CalendarTemplate.objects.filter(Q(farm=ctx.farm) | Q(farm__isnull=True)).get(
        pk=template_id, crop=cycle.crop
    )
    prior = CropCycleCalendar.objects.filter(crop_cycle=cycle).first()
    if prior:
        return prior
    anchor = cycle.actual_sowing_date or cycle.planned_sowing_date
    calendar = CropCycleCalendar.objects.create(
        farm=ctx.farm,
        crop_cycle=cycle,
        template=template,
        template_version_no=template.version_no,
        anchor_date=anchor,
        generated_at=timezone.now(),
    )
    previous = anchor
    for item in CalendarTemplateItem.objects.filter(template=template).order_by("created_at", "id"):
        day = anchor
        if item.anchor == "previous_item":
            day = previous
        elif item.anchor.startswith("stage"):
            if not item.stage_id:
                raise ValidationError("Stage anchor needs stage.")
            if template.stage_model.basis == "gdd":
                raise ValidationError(
                    "GDD calendar needs a forecast date from weather; no threshold-to-day guess is made."
                )
            threshold = (
                item.stage.start_threshold if item.anchor == "stage_start" else item.stage.end_threshold
            )
            day += timedelta(days=int(threshold))
        day += timedelta(days=item.offset_days_min)
        for repeat in range(item.repeat_max or 1):
            at = datetime.combine(
                day + timedelta(days=repeat * (item.repeat_every_days or 0)),
                time(8),
                tzinfo=ZoneInfo(ctx.farm.timezone),
            )
            create_event(
                ctx,
                {
                    "client_uuid": str(uuid.uuid5(cycle.pk, f"{item.pk}:{repeat}")),
                    "event_type": str(item.event_type_id),
                    "planned_start": at.isoformat(),
                    "trigger_kind": "calendar",
                    "calendar_item_ref": str(item.pk),
                    "targets": cycle_targets(cycle),
                },
            )
        previous = day
    return calendar


@command("cropscience.science.manage")
def record_stage(ctx, cycle_id, stage_id, observed_on, event_id):
    cycle = CropCycle.objects.select_for_update().get(pk=cycle_id, farm=ctx.farm)
    ctx.object(cycle, "record")
    stage = CropStage.objects.filter(Q(farm=ctx.farm) | Q(farm__isnull=True)).get(
        pk=stage_id, stage_model__crop=cycle.crop
    )
    source = Event.objects.get(pk=event_id, farm=ctx.farm)
    ctx.object(source, "record")
    if not ObservationDetail.objects.filter(event=source).exists():
        raise ValidationError("Source must be an observation event.")
    row = CropStageRecord.objects.create(
        farm=ctx.farm,
        crop_cycle=cycle,
        stage=stage,
        observed_on=observed_on,
        source_event=source,
        basis="observed",
    )
    if stage.stage_model.basis == "days":
        estimated = (cycle.actual_sowing_date or cycle.planned_sowing_date) + timedelta(
            days=int(stage.start_threshold)
        )
        delta = observed_on - estimated
        for e in Event.objects.filter(
            farm=ctx.farm,
            status="planned",
            calendar_item_ref__isnull=False,
            id__in=EventTarget.objects.filter(crop_cycle=cycle).values("event_id"),
            planned_start__date__gte=estimated,
        ):
            reschedule_event(ctx, e.pk, e.planned_start + delta, e.planned_end + delta, e.version)
    return row


@command("cropscience.science.manage")
def recompute_gdd(ctx, cycle_id):
    cycle = CropCycle.objects.get(pk=cycle_id, farm=ctx.farm)
    ctx.object(cycle, "view")
    calendar = CropCycleCalendar.objects.select_related("template__stage_model").get(crop_cycle=cycle)
    model = calendar.template.stage_model
    blocks = list(CropCycleBlock.objects.filter(crop_cycle=cycle).values_list("block_id", flat=True))
    weather = (
        WeatherDaily.objects.filter(farm=ctx.farm, date__gte=calendar.anchor_date, is_forecast=False)
        .filter(Q(block_id__in=blocks) | Q(block__isnull=True))
        .order_by("date")
    )
    grouped = {}
    for row in weather:
        grouped.setdefault(row.date, []).append(row)
    cumulative = Decimal(0)
    for date, rows in grouped.items():
        block_rows = [r for r in rows if r.block_id]
        rows = block_rows or rows
        daily = sum(gdd(r.tmin_c, r.tmax_c, model.base_temp_c, model.upper_temp_c) for r in rows) / len(rows)
        cumulative += daily
        GddDaily.objects.update_or_create(
            farm=ctx.farm, crop_cycle=cycle, date=date, defaults={"gdd": daily, "cumulative_gdd": cumulative}
        )
    return {"days": len(grouped), "cumulative_gdd": str(cumulative)}


@command("cropscience.science.manage")
def decide_suggestion(ctx, suggestion_id, accept, event_data=None):
    row = Suggestion.objects.select_for_update().get(pk=suggestion_id, farm=ctx.farm)
    ctx.object(row, "record")
    if row.status != "open":
        return row
    if accept:
        data = dict(event_data or {})
        data.update(
            event_type=str(row.recommended_event_type_id),
            trigger_kind="observation",
            targets=cycle_targets(row.crop_cycle),
        )
        row.resulting_event = create_event(ctx, data)
    row.status = "accepted" if accept else "dismissed"
    row.decided_by = ctx.user
    row.decided_at = timezone.now()
    row.save()
    return row
