import uuid
from datetime import datetime, timedelta, timezone
import pytest
from django.db import transaction
from rest_framework.exceptions import APIException
from apps.assets.models import Asset, StockItem
from apps.catalogue.models import Unit
from apps.events.models import EventType, SubEvent, StockMovement, Event
from apps.events.services import create_event, start_event, confirm_event
from apps.costing.models import CostRecord, CostAllocation


def event_data(ctx, kind, asset, qty, category, price="0"):
    start = datetime(2026, 10, 30, 8, tzinfo=timezone.utc)
    return {
        "client_uuid": str(uuid.uuid4()),
        "event_type": str(EventType.objects.get(farm=None, code=category).pk),
        "planned_start": start.isoformat(),
        "planned_end": (start + timedelta(hours=1)).isoformat(),
        "lines": [
            {
                "kind": kind,
                "asset": str(asset.pk),
                "qty_unit": str(Unit.objects.get(farm=None, code="kg").pk),
                "planned_qty": str(qty),
                "unit_price": price,
            }
        ],
    }


def finish(ctx, e):
    e = start_event(ctx, e.pk, e.version)
    return confirm_event(ctx, e.pk, version=e.version)


@pytest.fixture
def stock(ctx):
    asset = Asset.objects.create(farm=ctx.farm, asset_class="stock", code="UREA", name="Urea")
    item = StockItem.objects.create(
        farm=ctx.farm, asset=asset, base_unit=Unit.objects.get(farm=None, code="kg")
    )
    return asset, item


def test_purchase_consume_and_retry(ctx, stock):
    asset, item = stock
    data = event_data(ctx, "acquire_stock", asset, 100, "procurement", "30")
    e = create_event(ctx, data)
    assert create_event(ctx, data).pk == e.pk
    e = finish(ctx, e)
    assert confirm_event(ctx, e.pk).pk == e.pk
    item.refresh_from_db()
    assert item.on_hand_qty == 100 and item.avg_unit_cost == 30
    assert not CostRecord.objects.filter(event=e).exists()
    use = finish(ctx, create_event(ctx, event_data(ctx, "consume_stock", asset, 18, "crop_nutrition")))
    item.refresh_from_db()
    assert item.on_hand_qty == 82
    assert item.on_hand_qty * item.avg_unit_cost == 2460
    assert use.actual_cost_total == 540
    assert sum(CostAllocation.objects.filter(cost_record__event=use).values_list("amount", flat=True)) == 540
    assert StockMovement.objects.filter(stock_item=item).count() == 2


def test_shortage_rolls_back(ctx, stock):
    asset, item = stock
    before = Event.objects.count()
    with pytest.raises(APIException):
        create_event(ctx, event_data(ctx, "consume_stock", asset, 1, "crop_nutrition"))
    assert Event.objects.count() == before
    assert not StockMovement.objects.filter(stock_item=item).exists()


def test_idempotency_mismatch(ctx, stock):
    asset, _ = stock
    data = event_data(ctx, "acquire_stock", asset, 1, "procurement", "5")
    create_event(ctx, data)
    data["lines"][0]["planned_qty"] = "2"
    with pytest.raises(APIException):
        create_event(ctx, data)


def test_cross_farm_asset_rejected(ctx, stock, owner):
    from apps.identity.services import create_farm
    from apps.identity.access import Context

    asset, _ = stock
    other = create_farm(owner, {"name": "Other", "slug": "other"})
    with pytest.raises(APIException):
        create_event(
            Context.resolve(owner, other.pk), event_data(ctx, "acquire_stock", asset, 1, "procurement")
        )


def test_confirmation_correction_rollback(ctx, stock):
    asset, item = stock
    finish(ctx, create_event(ctx, event_data(ctx, "acquire_stock", asset, 10, "procurement", "2")))
    e = start_event(
        ctx, create_event(ctx, event_data(ctx, "consume_stock", asset, 5, "crop_nutrition")).pk, 1
    )
    line = SubEvent.objects.get(event=e)
    with pytest.raises(APIException):
        confirm_event(ctx, e.pk, {str(line.pk): {"actual_qty": "100"}}, e.version)
    item.refresh_from_db()
    line.refresh_from_db()
    e.refresh_from_db()
    assert item.on_hand_qty == 10 and line.actual_qty is None and e.status == "in_progress"


def test_immutable_movement_database(ctx, stock):
    from django.db import DatabaseError

    asset, _ = stock
    finish(ctx, create_event(ctx, event_data(ctx, "acquire_stock", asset, 10, "procurement", "2")))
    with pytest.raises(DatabaseError), transaction.atomic():
        StockMovement.objects.update(value=0)
