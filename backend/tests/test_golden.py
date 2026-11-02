"""The numerical example in section 15, including prepaid rent and idle cost."""

import uuid
from datetime import datetime, date, timedelta, timezone
from decimal import Decimal
from django.db.models import Sum
from apps.identity.access import Context
from apps.assets.models import Asset, StockItem, MachineDetail, SpaceDetail, Tenure
from apps.catalogue.models import Unit, Crop
from apps.land.models import Block, Season, CropCycle, CropCycleBlock
from apps.ledger.models import LedgerAccount, LedgerCategory, LedgerEntry
from apps.events.models import EventType
from apps.events.services import create_event, start_event, confirm_event
from apps.costing.models import DepreciationPolicy, CostAllocation
from apps.costing.services import (
    change_depreciation_policy,
    run_holding_accrual,
    run_reconciliation,
    register_value,
)


def test_golden_tractor_urea_prepaid_rent(ctx):
    units = {u.code: u for u in Unit.objects.filter(farm=None)}
    account = LedgerAccount.objects.create(
        farm=ctx.farm, name="Cash", kind="cash", opening_date=date(2026, 1, 1)
    )
    category = LedgerCategory.objects.get(farm=None, code="asset_purchase")
    tractor = Asset.objects.create(farm=ctx.farm, code="TRACTOR", name="Tractor", asset_class="machine")
    MachineDetail.objects.create(farm=ctx.farm, asset=tractor)
    stock_asset = Asset.objects.create(farm=ctx.farm, code="UREA", name="Urea", asset_class="stock")
    StockItem.objects.create(farm=ctx.farm, asset=stock_asset, base_unit=units["kg"])
    space = Asset.objects.create(farm=ctx.farm, code="LAND", name="Rented land", asset_class="space")
    block = Block.objects.create(
        farm=ctx.farm, code="B1", name="Block 1", area_value=10000, area_m2=10000, area_unit=units["m2"]
    )
    SpaceDetail.objects.create(farm=ctx.farm, asset=space, block=block)
    Tenure.objects.create(
        farm=ctx.farm,
        asset=space,
        tenure_kind="leased_in",
        start_date=date(2026, 1, 1),
        end_date=date(2026, 12, 31),
        rent_amount=36500,
        rent_period="year",
    )
    season = Season.objects.create(
        farm=ctx.farm, name="Winter", start_date=date(2026, 1, 1), end_date=date(2026, 3, 31)
    )
    cycle = CropCycle.objects.create(
        farm=ctx.farm,
        season=season,
        crop=Crop.objects.get(name="Brinjal", farm=None),
        code="C1",
        name="Brinjal",
        status="planned",
        planned_sowing_date=date(2026, 1, 5),
        expected_harvest_end=date(2026, 1, 20),
        expected_yield_unit=units["kg"],
    )
    CropCycleBlock.objects.create(
        farm=ctx.farm, crop_cycle=cycle, block=block, area_value=10000, area_m2=10000, area_unit=units["m2"]
    )

    def complete(category_code, lines, day=1, targets=None):
        start = datetime(2026, 1, day, 8, tzinfo=timezone.utc)
        event = create_event(
            ctx,
            {
                "client_uuid": str(uuid.uuid4()),
                "event_type": str(EventType.objects.get(farm=None, code=category_code).pk),
                "planned_start": start.isoformat(),
                "planned_end": (start + timedelta(hours=2)).isoformat(),
                "lines": lines,
                "targets": targets or [],
            },
        )
        event = start_event(ctx, event.pk, event.version)
        return confirm_event(ctx, event.pk, version=event.version)

    def payment(asset, amount, capital=False, terms=None):
        line = {
            "kind": "pay",
            "asset": str(asset.pk),
            "qty_unit": str(units["piece"].pk),
            "planned_qty": "1",
            "amount": str(amount),
            "account_id": str(account.pk),
            "ledger_category_id": str(category.pk),
        }
        if capital:
            line["capitalize_to_asset"] = str(asset.pk)
        if terms:
            line["capital_terms"] = terms
        return line

    complete("procurement", [payment(tractor, 600000, True, {"expected_life_hours": "8000"})])
    complete(
        "procurement",
        [
            {
                "kind": "acquire_stock",
                "asset": str(stock_asset.pk),
                "qty_unit": str(units["kg"].pk),
                "planned_qty": "100",
                "unit_price": "30",
            },
            payment(stock_asset, 3000),
        ],
    )
    complete("lease_tenure", [payment(space, 36500, True)])
    change_depreciation_policy(
        ctx,
        tractor.pk,
        DepreciationPolicy.objects.get(farm=None, code="units_of_production_hours").pk,
        date(2026, 1, 1),
    )
    operation = complete(
        "crop_nutrition",
        [
            {
                "kind": "use_machine",
                "asset": str(tractor.pk),
                "qty_unit": str(units["hour"].pk),
                "planned_qty": "2",
            },
            {
                "kind": "consume_stock",
                "asset": str(stock_asset.pk),
                "qty_unit": str(units["kg"].pk),
                "planned_qty": "18",
            },
        ],
        day=10,
        targets=[
            {
                "crop_cycle": str(cycle.pk),
                "block": str(block.pk),
                "area_unit": str(units["m2"].pk),
                "area_value": "10000",
            }
        ],
    )
    system = Context.for_system(ctx.farm)
    for day in range(1, 21):
        run_holding_accrual(system, date(2026, 1, day))
    # Re-running a day must have no second financial effect.
    run_holding_accrual(system, date(2026, 1, 20))
    assert operation.actual_cost_total == Decimal("690")
    assert CostAllocation.objects.filter(crop_cycle=cycle).aggregate(v=Sum("amount"))["v"] == Decimal("2290")
    assert CostAllocation.objects.filter(farm=ctx.farm, bucket="idle").aggregate(v=Sum("amount"))[
        "v"
    ] == Decimal("400")
    assert LedgerEntry.objects.filter(farm=ctx.farm).aggregate(v=Sum("amount"))["v"] == Decimal("639500")
    assert register_value(ctx, date(2026, 1, 20)) == Decimal("636810")
    reconciliation = run_reconciliation(ctx, date(2026, 1, 1), date(2026, 1, 20))
    assert reconciliation.difference == 0 and reconciliation.status == "balanced"
