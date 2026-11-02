from django.core.management.base import BaseCommand
from django.db import transaction
from apps.identity.services import seed_permissions
from apps.catalogue.models import Unit, PurposeTag, ProductCategory, Crop
from apps.events.models import EventCategory, EventType, EventTypeVersion
from apps.ledger.models import LedgerCategory
from apps.costing.models import DepreciationPolicy


class Command(BaseCommand):
    help = "Idempotently seed units, categories, starter event types, permissions and depreciation strategies. No pesticide doses."

    @transaction.atomic
    def handle(self, *args, **options):
        seed_permissions()
        for code, name, dimension, factor in [
            ("kg", "Kilogram", "mass", "1"),
            ("g", "Gram", "mass", ".001"),
            ("L", "Litre", "volume", "1"),
            ("mL", "Millilitre", "volume", ".001"),
            ("m2", "Square metre", "area", "1"),
            ("acre", "Acre", "area", "4046.8564"),
            ("ha", "Hectare", "area", "10000"),
            ("hour", "Hour", "time", "1"),
            ("day", "Day", "time", "24"),
            ("piece", "Piece", "count", "1"),
            ("m", "Metre", "length", "1"),
            ("kWh", "Kilowatt hour", "energy", "1"),
        ]:
            Unit.objects.get_or_create(
                farm=None,
                code=code,
                defaults={"name": name, "dimension": dimension, "to_base_factor": factor, "is_system": True},
            )
        for code in "nutrition disease_control weed_control pest_control irrigation planting harvest maintenance general".split():
            PurposeTag.objects.get_or_create(
                farm=None, code=code, defaults={"name": code.replace("_", " ").title()}
            )
        for code in "fertiliser fungicide herbicide insecticide seed fuel feed packaging".split():
            ProductCategory.objects.get_or_create(
                farm=None,
                code=code,
                defaults={
                    "name": code.title(),
                    "is_regulated": code in ["fungicide", "herbicide", "insecticide"],
                },
            )
        Crop.objects.get_or_create(
            farm=None,
            name="Brinjal",
            defaults={
                "scientific_name": "Solanum melongena",
                "default_yield_unit": Unit.objects.get(farm=None, code="kg"),
            },
        )
        common = ["use_machine", "use_labour", "consume_stock", "occupy_space"]
        categories = {
            "land_preparation": common,
            "planting": common,
            "crop_nutrition": common,
            "crop_protection": common,
            "water_management": common,
            "crop_care": common,
            "harvest": common + ["produce_stock"],
            "post_harvest": common + ["transfer_stock"],
            "livestock_care": common + ["living_gain", "living_loss"],
            "maintenance": common + ["asset_status"],
            "procurement": ["acquire_stock", "pay"],
            "sales": ["transfer_stock", "receive"],
            "stock_adjustment": ["adjust_stock"],
            "observation": [],
            "lease_tenure": ["occupy_space", "pay", "receive"],
            "system_accrual": ["accrue"],
        }
        for code, kinds in categories.items():
            category, _ = EventCategory.objects.get_or_create(
                farm=None,
                code=code,
                defaults={
                    "name": code.replace("_", " ").title(),
                    "is_system": True,
                    "allowed_sub_event_kinds": kinds,
                    "requires_crop_target": code in ["planting", "crop_protection", "harvest"],
                    "requires_safety_record": code == "crop_protection",
                    "creates_stock": code in ["procurement", "harvest"],
                    "involves_cash": code in ["procurement", "sales", "lease_tenure"],
                },
            )
            typ, _ = EventType.objects.get_or_create(
                farm=None,
                code=code,
                defaults={"category": category, "name": category.name, "target_kind": "none"},
            )
            EventTypeVersion.objects.get_or_create(farm=None, event_type=typ, version_no=1)
        for code in "asset_purchase operating_payment loan_principal interest sales_receipt subsidy other_income transfer".split():
            LedgerCategory.objects.get_or_create(
                farm=None, code=code, defaults={"name": code.replace("_", " ").title(), "kind": code}
            )
        for code in ["units_of_production_hours", "straight_line_daily"]:
            DepreciationPolicy.objects.get_or_create(
                farm=None,
                code=code,
                version_no=1,
                defaults={"name": code.replace("_", " ").title(), "strategy_code": code},
            )
        self.stdout.write(self.style.SUCCESS("System reference data is ready."))
