from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped


class Asset(Scoped):
    asset_class = models.CharField(
        max_length=40,
        choices=[
            ("space", "space"),
            ("machine", "machine"),
            ("person", "person"),
            ("stock", "stock"),
            ("living", "living"),
            ("flow", "flow"),
        ],
        default="space",
    )
    name = models.TextField(blank=True, default="")
    code = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40,
        choices=[("active", "active"), ("maintenance", "maintenance"), ("retired", "retired")],
        default="active",
    )
    acquired_on = models.DateField(null=True, blank=True)
    retired_on = models.DateField(null=True, blank=True)
    home_location = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    attributes = models.JSONField(default=dict, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(asset_class__in=["space", "machine", "person", "stock", "living", "flow"]),
                name="assets_asset_asset_class_valid",
            ),
            models.CheckConstraint(
                condition=Q(status__in=["active", "maintenance", "retired"]), name="assets_asset_status_valid"
            ),
            models.UniqueConstraint(fields=["farm", "code"], name="assets_asset_u2", nulls_distinct=False),
        ]


class SpaceDetail(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    block = models.OneToOneField(
        "land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    space_type = models.CharField(
        max_length=40,
        choices=[
            ("land", "land"),
            ("shed", "shed"),
            ("store", "store"),
            ("cold_store", "cold store"),
            ("well", "well"),
            ("pond", "pond"),
            ("other", "other"),
        ],
        default="land",
    )
    capacity_value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    capacity_unit = models.ForeignKey(
        "catalogue.Unit", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    location = models.GeometryField(srid=4326, null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(space_type__in=["land", "shed", "store", "cold_store", "well", "pond", "other"]),
                name="assets_spacedetail_space_type_valid",
            )
        ]


class MachineDetail(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    machine_type = models.TextField(blank=True, default="")
    make = models.TextField(blank=True, default="")
    model = models.TextField(blank=True, default="")
    year = models.PositiveIntegerField(default=None, null=True, blank=True)
    meter_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    fuel_stock_item = models.ForeignKey(
        "assets.StockItem", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    fuel_rate_per_hour = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    capacity_note = models.TextField(blank=True, default="")


class PersonDetail(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    user = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    person_type = models.CharField(
        max_length=40,
        choices=[
            ("family", "family"),
            ("permanent", "permanent"),
            ("seasonal", "seasonal"),
            ("contract", "contract"),
        ],
        default="family",
    )
    skills = models.JSONField(default=dict, blank=True)
    phone = models.TextField(blank=True, default="")
    wage_basis = models.CharField(
        max_length=40,
        choices=[("hourly", "hourly"), ("daily", "daily"), ("monthly", "monthly")],
        default="hourly",
    )
    is_paid = models.BooleanField(default=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(person_type__in=["family", "permanent", "seasonal", "contract"]),
                name="assets_persondetail_person_type_valid",
            ),
            models.CheckConstraint(
                condition=Q(wage_basis__in=["hourly", "daily", "monthly"]),
                name="assets_persondetail_wage_basis_valid",
            ),
        ]


class StockItem(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    product = models.ForeignKey(
        "catalogue.Product", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    crop = models.ForeignKey(
        "catalogue.Crop", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    stock_kind = models.CharField(
        max_length=40,
        choices=[
            ("input", "input"),
            ("produce", "produce"),
            ("by_product", "by product"),
            ("consumable", "consumable"),
            ("packaging", "packaging"),
        ],
        default="input",
    )
    base_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    valuation_method = models.CharField(
        max_length=40,
        choices=[("weighted_average", "weighted average"), ("FIFO", "FIFO")],
        default="weighted_average",
    )
    on_hand_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    avg_unit_cost = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    reorder_level = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    shelf_life_days = models.PositiveIntegerField(default=None, null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(stock_kind__in=["input", "produce", "by_product", "consumable", "packaging"]),
                name="assets_stockitem_stock_kind_valid",
            ),
            models.CheckConstraint(
                condition=Q(valuation_method__in=["weighted_average", "FIFO"]),
                name="assets_stockitem_valuation_method_valid",
            ),
        ]


class StockLot(Scoped):
    stock_item = models.ForeignKey("assets.StockItem", on_delete=models.PROTECT, related_name="+")
    lot_code = models.TextField(blank=True, default="")
    supplier = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    received_on = models.DateField()
    expiry_date = models.DateField(null=True, blank=True)
    initial_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    remaining_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    storage_location = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    grade = models.ForeignKey(
        "catalogue.ProduceGrade", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    source_sub_event_id = models.UUIDField(null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "stock_item", "lot_code"], name="assets_stocklot_u0", nulls_distinct=False
            )
        ]


class LivingDetail(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    living_type = models.CharField(
        max_length=40,
        choices=[
            ("animal_group", "animal group"),
            ("single_animal", "single animal"),
            ("orchard", "orchard"),
            ("tree_block", "tree block"),
        ],
        default="animal_group",
    )
    species = models.TextField(blank=True, default="")
    head_count = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    start_date = models.DateField()
    lifecycle_stage = models.TextField(blank=True, default="")
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(living_type__in=["animal_group", "single_animal", "orchard", "tree_block"]),
                name="assets_livingdetail_living_type_valid",
            )
        ]


class FlowDetail(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    flow_type = models.CharField(
        max_length=40,
        choices=[
            ("water", "water"),
            ("electricity", "electricity"),
            ("diesel_feed", "diesel feed"),
            ("solar", "solar"),
        ],
        default="water",
    )
    source_description = models.TextField(blank=True, default="")
    unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    rated_capacity = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    is_metered = models.BooleanField(default=False)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(flow_type__in=["water", "electricity", "diesel_feed", "solar"]),
                name="assets_flowdetail_flow_type_valid",
            )
        ]


class Tenure(Scoped):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    owner_party = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    holder_party = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    user_party = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    tenure_kind = models.CharField(
        max_length=40,
        choices=[
            ("owned", "owned"),
            ("leased_in", "leased in"),
            ("leased_out", "leased out"),
            ("shared_crop", "shared crop"),
            ("borrowed", "borrowed"),
            ("hired", "hired"),
        ],
        default="owned",
    )
    start_date = models.DateField()
    end_date = models.DateField(null=True, blank=True)
    rent_amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    rent_period = models.CharField(
        max_length=40,
        choices=[("day", "day"), ("month", "month"), ("year", "year"), ("season", "season")],
        default="day",
    )
    payment_terms = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    tenure_kind__in=["owned", "leased_in", "leased_out", "shared_crop", "borrowed", "hired"]
                ),
                name="assets_tenure_tenure_kind_valid",
            ),
            models.CheckConstraint(
                condition=Q(rent_period__in=["day", "month", "year", "season"]),
                name="assets_tenure_rent_period_valid",
            ),
        ]


StockItem._meta.constraints += [
    models.CheckConstraint(condition=Q(on_hand_qty__gte=0), name="stock_on_hand_nonnegative")
]
StockLot._meta.constraints += [
    models.CheckConstraint(condition=Q(remaining_qty__gte=0), name="stock_lot_nonnegative")
]
