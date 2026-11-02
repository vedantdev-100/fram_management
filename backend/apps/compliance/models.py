from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Immutable


class TreatmentRecord(Immutable):
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+")
    product = models.ForeignKey("catalogue.Product", on_delete=models.PROTECT, related_name="+")
    stock_lot = models.ForeignKey(
        "assets.StockLot", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    qty_applied = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    qty_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    area_covered_m2 = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    dose_per_area = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    applied_at = models.DateTimeField()
    operator = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    weather_note = models.TextField(blank=True, default="")
    mode_of_action_group = models.TextField(blank=True, default="")
    waiting_period_ends_on = models.DateField()
    reentry_ends_at = models.DateTimeField()
    reversal_of = models.ForeignKey(
        "compliance.TreatmentRecord", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )


class ComplianceCheck(Immutable):
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    sub_event = models.ForeignKey(
        "events.SubEvent", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    check_code = models.TextField(blank=True, default="")
    result = models.CharField(
        max_length=40, choices=[("pass", "pass"), ("warn", "warn"), ("block", "block")], default="pass"
    )
    message = models.TextField(blank=True, default="")
    evaluated_at = models.DateTimeField()

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(result__in=["pass", "warn", "block"]),
                name="compliance_compliancecheck_result_valid",
            )
        ]


class ComplianceOverride(Immutable):
    compliance_check = models.ForeignKey(
        "compliance.ComplianceCheck", on_delete=models.PROTECT, related_name="+"
    )
    overridden_by = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")
    reason = models.TextField(blank=True, default="")
