from decimal import Decimal
from django.db.models import Sum
from apps.costing.models import CostAllocation, CostRecord
from apps.events.models import EventTarget
from apps.ledger.models import LedgerEntry, LedgerAccount
from apps.assets.models import StockItem
from apps.land.models import CropCycle
from apps.identity.access import scoped_queryset


def report(ctx, name):
    ctx.require("reporting.report.view")
    if name in ("crop-cycle-profit-loss", "operation-cost", "plan-versus-actual", "cash-timeline"):
        ctx.require("costing.cost.view")
    if name == "stock-status":
        return list(
            StockItem.objects.filter(farm=ctx.farm).values(
                "id", "asset__name", "on_hand_qty", "reorder_level"
            )
        )
    if name == "cash-timeline":
        ctx.require("ledger.entry.view")
        from apps.ledger.services import balance

        return [
            {"account": str(a.pk), "name": a.name, "balance": str(balance(a))}
            for a in LedgerAccount.objects.filter(farm=ctx.farm)
        ]
    if name == "operation-cost":
        return list(scoped_queryset(ctx, CostRecord).values("cost_nature").annotate(amount=Sum("amount")))
    if name == "plan-versus-actual":
        from apps.events.models import Event

        return list(
            scoped_queryset(ctx, Event).values("id", "title", "planned_cost_total", "actual_cost_total")
        )
    if name == "crop-cycle-profit-loss":
        rows = []
        for c in scoped_queryset(ctx, CropCycle):
            cost = CostAllocation.objects.filter(farm=ctx.farm, crop_cycle=c).aggregate(v=Sum("amount"))[
                "v"
            ] or Decimal(0)
            revenue = Decimal(0)
            for t in EventTarget.objects.filter(crop_cycle=c, event__status="done"):
                receipts = LedgerEntry.objects.filter(event=t.event, category__kind="sales_receipt")
                revenue += (
                    sum((e.amount if e.direction == "in" else -e.amount for e in receipts), Decimal(0))
                    * t.share_fraction
                )
            rows.append(
                {
                    "crop_cycle": str(c.pk),
                    "name": c.name,
                    "cost": str(cost),
                    "revenue": str(revenue),
                    "margin": str(revenue - cost),
                }
            )
        return rows
    if name == "availability":
        from apps.events.models import Reservation

        return [
            {"asset": str(r.asset_id), "start": r.window.lower, "end": r.window.upper, "status": r.status}
            for r in scoped_queryset(ctx, Reservation).filter(status="active")
        ]
    if name == "utilisation":
        from apps.events.models import MeterEntry

        return list(scoped_queryset(ctx, MeterEntry).values("machine_id").annotate(hours=Sum("delta_hours")))
    from rest_framework.exceptions import NotFound

    raise NotFound("Unknown report.")
