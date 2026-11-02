from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped, Immutable


class Block(Scoped):
    parent = models.ForeignKey(
        "land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    area_value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    area_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    area_m2 = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    geometry = models.GeometryField(srid=4326, null=True, blank=True)
    area_source = models.CharField(
        max_length=40, choices=[("entered", "entered"), ("drawn", "drawn")], default="entered"
    )
    centroid = models.PointField(srid=4326, null=True, blank=True)
    soil_type = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40,
        choices=[("active", "active"), ("fallow", "fallow"), ("retired", "retired")],
        default="active",
    )
    notes = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(area_source__in=["entered", "drawn"]), name="land_block_area_source_valid"
            ),
            models.CheckConstraint(
                condition=Q(status__in=["active", "fallow", "retired"]), name="land_block_status_valid"
            ),
            models.UniqueConstraint(fields=["farm", "code"], name="land_block_u2", nulls_distinct=False),
        ]


class BlockBoundaryRevision(Immutable):
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+")
    geometry = models.GeometryField(srid=4326)
    area_m2 = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    source = models.CharField(
        max_length=40, choices=[("drawn", "drawn"), ("imported", "imported"), ("gps", "gps")], default="drawn"
    )
    effective_from = models.DateTimeField()
    note = models.TextField(blank=True, default="")

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(source__in=["drawn", "imported", "gps"]),
                name="land_blockboundaryrevision_source_valid",
            )
        ]


class BlockAccess(Scoped):
    membership = models.ForeignKey("identity.Membership", on_delete=models.PROTECT, related_name="+")
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+")
    access_level = models.CharField(
        max_length=40, choices=[("view", "view"), ("record", "record"), ("manage", "manage")], default="view"
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(access_level__in=["view", "record", "manage"]),
                name="land_blockaccess_access_level_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "membership", "block"], name="land_blockaccess_u1", nulls_distinct=False
            ),
        ]


class Season(Scoped):
    name = models.TextField(blank=True, default="")
    kind = models.TextField(blank=True, default="")
    start_date = models.DateField()
    end_date = models.DateField()
    status = models.CharField(
        max_length=40,
        choices=[("planned", "planned"), ("active", "active"), ("closed", "closed")],
        default="planned",
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["planned", "active", "closed"]), name="land_season_status_valid"
            )
        ]


class CropCycle(Scoped):
    season = models.ForeignKey("land.Season", on_delete=models.PROTECT, related_name="+")
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    variety = models.ForeignKey(
        "catalogue.Variety", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40,
        choices=[
            ("draft", "draft"),
            ("planned", "planned"),
            ("active", "active"),
            ("harvesting", "harvesting"),
            ("closed", "closed"),
            ("abandoned", "abandoned"),
        ],
        default="draft",
    )
    planned_sowing_date = models.DateField()
    actual_sowing_date = models.DateField(null=True, blank=True)
    expected_harvest_start = models.DateField(null=True, blank=True)
    expected_harvest_end = models.DateField()
    actual_harvest_end = models.DateField(null=True, blank=True)
    expected_yield_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    expected_yield_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    expected_price_per_unit = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    notes = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["draft", "planned", "active", "harvesting", "closed", "abandoned"]),
                name="land_cropcycle_status_valid",
            ),
            models.UniqueConstraint(fields=["farm", "code"], name="land_cropcycle_u1", nulls_distinct=False),
        ]


class CropCycleBlock(Scoped):
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+")
    area_value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    area_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    area_m2 = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    is_intercrop = models.BooleanField(default=False)
    geometry = models.GeometryField(srid=4326, null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "crop_cycle", "block"], name="land_cropcycleblock_u0", nulls_distinct=False
            )
        ]
