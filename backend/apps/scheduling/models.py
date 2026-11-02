from django.contrib.gis.db import models
from django.contrib.postgres.fields import DateTimeRangeField
from django.db.models import Q
from apps.core.models import Scoped


class AvailabilityWindow(Scoped):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    kind = models.CharField(
        max_length=40,
        choices=[
            ("shift", "shift"),
            ("downtime", "downtime"),
            ("leave", "leave"),
            ("maintenance", "maintenance"),
        ],
        default="shift",
    )
    window = DateTimeRangeField()
    capacity_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    recurrence_rule = models.TextField(blank=True, default="")
    reason = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(kind__in=["shift", "downtime", "leave", "maintenance"]),
                name="scheduling_availabilitywindow_kind_valid",
            )
        ]


class RestrictionWindow(Scoped):
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True)
    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    window = DateTimeRangeField()
    restriction_kind = models.CharField(
        max_length=40,
        choices=[("reentry", "reentry"), ("no_spray", "no spray"), ("no_harvest", "no harvest")],
        default="reentry",
    )
    source_type = models.TextField(blank=True, default="")
    source_id = models.UUIDField(null=True, blank=True)
    reason = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(restriction_kind__in=["reentry", "no_spray", "no_harvest"]),
                name="scheduling_restrictionwindow_restriction_kind_valid",
            )
        ]
