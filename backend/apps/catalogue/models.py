from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped, Shared


class Unit(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    dimension = models.CharField(
        max_length=40,
        choices=[
            ("mass", "mass"),
            ("volume", "volume"),
            ("area", "area"),
            ("time", "time"),
            ("count", "count"),
            ("length", "length"),
            ("energy", "energy"),
        ],
        default="mass",
    )
    to_base_factor = models.DecimalField(max_digits=14, decimal_places=4, default=1)
    is_system = models.BooleanField(default=False)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(dimension__in=["mass", "volume", "area", "time", "count", "length", "energy"]),
                name="catalogue_unit_dimension_valid",
            ),
            models.UniqueConstraint(fields=["farm", "code"], name="catalogue_unit_u1", nulls_distinct=False),
        ]


class PurposeTag(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "code"], name="catalogue_purposetag_u0", nulls_distinct=False
            )
        ]


class Crop(Shared):
    name = models.TextField(blank=True, default="")
    scientific_name = models.TextField(blank=True, default="")
    category = models.TextField(blank=True, default="")
    lifecycle = models.CharField(
        max_length=40,
        choices=[("annual", "annual"), ("biennial", "biennial"), ("perennial", "perennial")],
        default="annual",
    )
    default_yield_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    is_active = models.BooleanField(default=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(lifecycle__in=["annual", "biennial", "perennial"]),
                name="catalogue_crop_lifecycle_valid",
            )
        ]


class Variety(Shared):
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    name = models.TextField(blank=True, default="")
    typical_duration_days = models.PositiveIntegerField(default=0)
    attributes = models.JSONField(default=dict, blank=True)


class ProductCategory(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    default_purpose_tag = models.ForeignKey(
        "catalogue.PurposeTag", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    is_regulated = models.BooleanField(default=False)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "code"], name="catalogue_productcategory_u0", nulls_distinct=False
            )
        ]


class Product(Shared):
    name = models.TextField(blank=True, default="")
    category = models.ForeignKey("catalogue.ProductCategory", on_delete=models.PROTECT, related_name="+")
    default_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    manufacturer = models.TextField(blank=True, default="")
    active_ingredient = models.TextField(blank=True, default="")
    formulation = models.TextField(blank=True, default="")
    mode_of_action_group = models.TextField(blank=True, default="")
    registration_no = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)


class ProductCropLabel(Shared):
    product = models.ForeignKey("catalogue.Product", on_delete=models.PROTECT, related_name="+")
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    dose_min = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    dose_max = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    dose_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    per_area_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    waiting_period_days = models.PositiveIntegerField(default=0)
    reentry_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    max_applications_per_cycle = models.PositiveIntegerField(default=None, null=True, blank=True)
    min_interval_days = models.PositiveIntegerField(default=0)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "product", "crop"], name="catalogue_productcroplabel_u0", nulls_distinct=False
            )
        ]


class ProduceGrade(Shared):
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    sort_order = models.PositiveIntegerField(default=0)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "crop", "code"], name="catalogue_producegrade_u0", nulls_distinct=False
            )
        ]


class Counterparty(Scoped):
    name = models.TextField(blank=True, default="")
    kind = models.CharField(
        max_length=40,
        choices=[
            ("supplier", "supplier"),
            ("buyer", "buyer"),
            ("landlord", "landlord"),
            ("lender", "lender"),
            ("labour_contractor", "labour contractor"),
            ("government", "government"),
            ("other", "other"),
        ],
        default="supplier",
    )
    phone = models.TextField(blank=True, default="")
    address = models.TextField(blank=True, default="")
    notes = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    kind__in=[
                        "supplier",
                        "buyer",
                        "landlord",
                        "lender",
                        "labour_contractor",
                        "government",
                        "other",
                    ]
                ),
                name="catalogue_counterparty_kind_valid",
            )
        ]
