from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped, Shared


class CropStageModel(Shared):
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    variety = models.ForeignKey(
        "catalogue.Variety", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    name = models.TextField(blank=True, default="")
    basis = models.CharField(max_length=40, choices=[("days", "days"), ("gdd", "gdd")], default="days")
    base_temp_c = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    upper_temp_c = models.DecimalField(max_digits=14, decimal_places=4, default=0, null=True, blank=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(basis__in=["days", "gdd"]), name="cropscience_cropstagemodel_basis_valid"
            )
        ]


class CropStage(Shared):
    stage_model = models.ForeignKey("cropscience.CropStageModel", on_delete=models.PROTECT, related_name="+")
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    order_no = models.PositiveIntegerField(default=0)
    start_threshold = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    end_threshold = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    is_critical = models.BooleanField(default=False)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "stage_model", "code"], name="cropscience_cropstage_u0", nulls_distinct=False
            )
        ]


class CalendarTemplate(Shared):
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    variety = models.ForeignKey(
        "catalogue.Variety", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    name = models.TextField(blank=True, default="")
    stage_model = models.ForeignKey("cropscience.CropStageModel", on_delete=models.PROTECT, related_name="+")
    version_no = models.PositiveIntegerField(default=1)
    region_note = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)


class CalendarTemplateItem(Shared):
    template = models.ForeignKey("cropscience.CalendarTemplate", on_delete=models.PROTECT, related_name="+")
    event_type = models.ForeignKey("events.EventType", on_delete=models.PROTECT, related_name="+")
    label = models.TextField(blank=True, default="")
    anchor = models.CharField(
        max_length=40,
        choices=[
            ("sowing", "sowing"),
            ("stage_start", "stage start"),
            ("stage_end", "stage end"),
            ("previous_item", "previous item"),
        ],
        default="sowing",
    )
    stage = models.ForeignKey(
        "cropscience.CropStage", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    offset_days_min = models.PositiveIntegerField(default=0)
    offset_days_max = models.PositiveIntegerField(default=0)
    repeat_every_days = models.PositiveIntegerField(default=0, null=True, blank=True)
    repeat_max = models.PositiveIntegerField(default=1)
    is_optional = models.BooleanField(default=False)
    notes = models.TextField(blank=True, default="")

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(anchor__in=["sowing", "stage_start", "stage_end", "previous_item"]),
                name="cropscience_calendartemplateitem_anchor_valid",
            )
        ]


class CropCycleCalendar(Scoped):
    crop_cycle = models.OneToOneField("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    template = models.ForeignKey("cropscience.CalendarTemplate", on_delete=models.PROTECT, related_name="+")
    template_version_no = models.PositiveIntegerField(default=0)
    anchor_date = models.DateField()
    generated_at = models.DateTimeField()


class CropStageRecord(Scoped):
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    stage = models.ForeignKey("cropscience.CropStage", on_delete=models.PROTECT, related_name="+")
    observed_on = models.DateField()
    source_event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    basis = models.CharField(
        max_length=40, choices=[("estimated", "estimated"), ("observed", "observed")], default="estimated"
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(basis__in=["estimated", "observed"]),
                name="cropscience_cropstagerecord_basis_valid",
            )
        ]


class WeatherDaily(Scoped):
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True)
    date = models.DateField()
    tmin_c = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    tmax_c = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    rain_mm = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    source = models.CharField(
        max_length=40, choices=[("manual", "manual"), ("service", "service")], default="manual"
    )
    is_forecast = models.BooleanField(default=False)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(source__in=["manual", "service"]), name="cropscience_weatherdaily_source_valid"
            ),
            models.UniqueConstraint(
                fields=["farm", "block", "date", "is_forecast"],
                name="cropscience_weatherdaily_u1",
                nulls_distinct=False,
            ),
        ]


class GddDaily(Scoped):
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    date = models.DateField()
    gdd = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    cumulative_gdd = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "crop_cycle", "date"], name="cropscience_gdddaily_u0", nulls_distinct=False
            )
        ]


class ThresholdRule(Shared):
    crop = models.ForeignKey("catalogue.Crop", on_delete=models.PROTECT, related_name="+")
    observation_kind = models.TextField(blank=True, default="")
    metric_name = models.TextField(blank=True, default="")
    operator = models.CharField(
        max_length=40,
        choices=[("gt", "gt"), ("gte", "gte"), ("lt", "lt"), ("lte", "lte"), ("eq", "eq")],
        default="gt",
    )
    threshold_value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    severity_min = models.PositiveIntegerField(default=0)
    recommended_event_type = models.ForeignKey("events.EventType", on_delete=models.PROTECT, related_name="+")
    message = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(operator__in=["gt", "gte", "lt", "lte", "eq"]),
                name="cropscience_thresholdrule_operator_valid",
            )
        ]


class Suggestion(Scoped):
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    source_event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    rule = models.ForeignKey("cropscience.ThresholdRule", on_delete=models.PROTECT, related_name="+")
    recommended_event_type = models.ForeignKey("events.EventType", on_delete=models.PROTECT, related_name="+")
    status = models.CharField(
        max_length=40,
        choices=[("open", "open"), ("accepted", "accepted"), ("dismissed", "dismissed")],
        default="open",
    )
    decided_by = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    decided_at = models.DateTimeField(null=True, blank=True)
    resulting_event = models.ForeignKey(
        "events.Event", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["open", "accepted", "dismissed"]),
                name="cropscience_suggestion_status_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "source_event", "rule", "crop_cycle"],
                name="cropscience_suggestion_u1",
                nulls_distinct=False,
            ),
        ]
