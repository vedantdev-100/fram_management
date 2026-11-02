from decimal import Decimal
from django.core.management.base import BaseCommand
from django.db import transaction
from django.db.models import Sum
from apps.assets.models import Asset, StockItem, StockLot, MachineDetail, LivingDetail
from apps.events.models import StockMovement, MeterEntry, LivingEntry


class Command(BaseCommand):
    help = "Compare caches with immutable ledgers; use --apply to repair. Scoped to one farm."

    def add_arguments(self, parser):
        parser.add_argument("--farm", required=True)
        parser.add_argument("--apply", action="store_true")

    @transaction.atomic
    def handle(self, *args, **o):
        list(Asset.objects.select_for_update().filter(farm_id=o["farm"]).order_by("id"))
        for item in StockItem.objects.filter(farm_id=o["farm"]):
            q = StockMovement.objects.filter(stock_item=item)
            qty = q.aggregate(v=Sum("qty_canonical"))["v"] or Decimal(0)
            value = q.aggregate(v=Sum("value"))["v"] or Decimal(0)
            self.stdout.write(f"{item.pk}: cache={item.on_hand_qty}; ledger={qty}")
            if o["apply"]:
                item.on_hand_qty = qty
                item.avg_unit_cost = value / qty if qty else 0
                item.save()
        for lot in StockLot.objects.filter(farm_id=o["farm"]):
            qty = StockMovement.objects.filter(lot=lot).aggregate(v=Sum("qty_canonical"))["v"] or 0
            if o["apply"]:
                lot.remaining_qty = qty
                lot.save()
        for machine in MachineDetail.objects.filter(farm_id=o["farm"]):
            qty = MeterEntry.objects.filter(machine=machine.asset).aggregate(v=Sum("delta_hours"))["v"] or 0
            if o["apply"]:
                machine.meter_hours = qty
                machine.save()
        for living in LivingDetail.objects.filter(farm_id=o["farm"]):
            qty = (
                LivingEntry.objects.filter(living_asset=living.asset).aggregate(v=Sum("delta_count"))["v"]
                or 0
            )
            if o["apply"]:
                living.head_count = qty
                living.save()
