from decimal import Decimal
from django.db.models import Sum
from django.utils import timezone
from apps.core.commands import command, digest
from apps.core.errors import Conflict
from apps.events.models import Event
from apps.events.services import reserve
from apps.land.models import CropCycleBlock
from .models import Scenario, ScenarioAssumption, ScenarioCropCycle, ScenarioMetric

D = Decimal


@command("workbench.scenario.compute")
def compute_metrics(ctx, scenario_id):
    scenario = Scenario.objects.select_for_update().get(pk=scenario_id, farm=ctx.farm)
    assumptions = list(ScenarioAssumption.objects.filter(scenario=scenario))
    revenue = D(0)
    area = D(0)
    for link in ScenarioCropCycle.objects.filter(scenario=scenario):
        c = link.crop_cycle
        ctx.object(c)
        price = D(1)
        yield_factor = D(1)
        for a in assumptions:
            if a.crop_id not in (None, c.crop_id):
                continue
            if a.key == "price_multiplier":
                price = a.value
            if a.key == "yield_multiplier":
                yield_factor = a.value
        revenue += c.expected_yield_qty * c.expected_price_per_unit * price * yield_factor
        area += CropCycleBlock.objects.filter(crop_cycle=c).aggregate(v=Sum("area_m2"))["v"] or 0
    operation = Event.objects.filter(farm=ctx.farm, scenario_ref=scenario.pk).aggregate(
        v=Sum("planned_cost_total")
    )["v"] or D(0)
    values = {
        "revenue": revenue,
        "operation_cost": operation,
        "profit": revenue - operation,
        "margin_per_area": (revenue - operation) / area if area else 0,
    }
    fingerprint = digest([(str(a.pk), str(a.value)) for a in assumptions])
    ScenarioMetric.objects.filter(scenario=scenario).delete()
    for code, value in values.items():
        ScenarioMetric.objects.create(
            farm=ctx.farm,
            scenario=scenario,
            metric_code=code,
            value=value,
            computed_at=timezone.now(),
            assumptions_hash=fingerprint,
        )
    scenario.status = "compared"
    scenario.save()
    return {k: str(v) for k, v in values.items()}


@command("workbench.scenario.adopt")
def adopt_scenario(ctx, scenario_id):
    from apps.events.models import SubEvent
    from apps.land.services import attach_blocks

    scenario = Scenario.objects.select_for_update().get(pk=scenario_id, farm=ctx.farm)
    if scenario.status == "adopted":
        return scenario
    if scenario.status not in ("draft", "compared"):
        raise Conflict("Scenario cannot be adopted.")
    for link in ScenarioCropCycle.objects.filter(scenario=scenario).select_related("crop_cycle"):
        c = link.crop_cycle
        if c.status != "draft":
            raise Conflict("Scenario cycles must be drafts.")
        c.status = "planned"
        c.save()
        attach_blocks(
            ctx,
            c.pk,
            [
                {
                    "block": str(b.block_id),
                    "area_value": str(b.area_value),
                    "area_unit": str(b.area_unit_id),
                    "is_intercrop": b.is_intercrop,
                }
                for b in CropCycleBlock.objects.filter(crop_cycle=c)
            ],
        )
    for event in Event.objects.select_for_update().filter(farm=ctx.farm, scenario_ref=scenario.pk):
        if event.status != "draft":
            raise Conflict("Scenario events must be drafts.")
        reserve(ctx, event, list(SubEvent.objects.filter(event=event)))
        event.status = "planned"
        event.scenario_ref = None
        event.version += 1
        event.save()
    scenario.status = "adopted"
    scenario.adopted_at = timezone.now()
    scenario.save()
    return scenario


def investment(inputs):
    price = D(str(inputs.get("price", 0)))
    salvage = D(str(inputs.get("salvage", 0)))
    years = D(str(inputs.get("life_years", 1)))
    hours = D(str(inputs.get("hours_per_year", 1)))
    if years <= 0 or hours <= 0:
        raise ValueError("Life and hours must be positive.")
    annual = (price - salvage) / years + (price + salvage) / 2 * D(str(inputs.get("interest_rate", 0))) / 100
    return {
        "annual_ownership_cost": str(annual.quantize(D(".01"))),
        "ownership_cost_per_hour": str((annual / hours).quantize(D(".01"))),
        "annual_hire_cost": str(hours * D(str(inputs.get("hire_rate", 0)))),
        "annual_lease_cost": str(inputs.get("annual_rent", 0)),
    }
