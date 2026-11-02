from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped


class Scenario(Scoped):
    season = models.ForeignKey("land.Season", on_delete=models.PROTECT, related_name="+")
    name = models.TextField(blank=True, default="")
    description = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40,
        choices=[
            ("draft", "draft"),
            ("compared", "compared"),
            ("adopted", "adopted"),
            ("archived", "archived"),
        ],
        default="draft",
    )
    based_on = models.ForeignKey(
        "workbench.Scenario", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    adopted_at = models.DateTimeField(null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["draft", "compared", "adopted", "archived"]),
                name="workbench_scenario_status_valid",
            )
        ]


class ScenarioAssumption(Scoped):
    scenario = models.ForeignKey("workbench.Scenario", on_delete=models.PROTECT, related_name="+")
    key = models.CharField(
        max_length=40,
        choices=[
            ("price_multiplier", "price multiplier"),
            ("yield_multiplier", "yield multiplier"),
            ("wage_rate", "wage rate"),
            ("fuel_price", "fuel price"),
            ("rent", "rent"),
        ],
        default="price_multiplier",
    )
    crop = models.ForeignKey(
        "catalogue.Crop", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    value = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    key__in=["price_multiplier", "yield_multiplier", "wage_rate", "fuel_price", "rent"]
                ),
                name="workbench_scenarioassumption_key_valid",
            )
        ]


class ScenarioCropCycle(Scoped):
    scenario = models.ForeignKey("workbench.Scenario", on_delete=models.PROTECT, related_name="+")
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "scenario", "crop_cycle"],
                name="workbench_scenariocropcycle_u0",
                nulls_distinct=False,
            )
        ]


class ScenarioMetric(Scoped):
    scenario = models.ForeignKey("workbench.Scenario", on_delete=models.PROTECT, related_name="+")
    metric_code = models.TextField(blank=True, default="")
    crop_cycle = models.ForeignKey(
        "land.CropCycle", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    computed_at = models.DateTimeField()
    assumptions_hash = models.TextField(blank=True, default="")


class DecisionJournal(Scoped):
    decided_on = models.DateField()
    decided_by = models.ForeignKey("identity.User", on_delete=models.PROTECT, related_name="+")
    title = models.TextField(blank=True, default="")
    decision_text = models.TextField(blank=True, default="")
    reason = models.TextField(blank=True, default="")
    assumptions = models.JSONField(default=dict, blank=True)
    expected = models.JSONField(default=dict, blank=True)
    scenario = models.ForeignKey(
        "workbench.Scenario", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    crop_cycle = models.ForeignKey(
        "land.CropCycle", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    event = models.ForeignKey(
        "events.Event", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    review_on = models.DateField(null=True, blank=True)
    outcome_text = models.TextField(blank=True, default="")
    outcome_logged_at = models.DateTimeField(null=True, blank=True)


class InvestmentAnalysis(Scoped):
    name = models.TextField(blank=True, default="")
    option_kind = models.CharField(
        max_length=40,
        choices=[("buy", "buy"), ("lease", "lease"), ("hire", "hire"), ("skip", "skip")],
        default="buy",
    )
    asset_class = models.TextField(blank=True, default="")
    inputs = models.JSONField(default=dict, blank=True)
    results = models.JSONField(default=dict, blank=True)
    decision = models.ForeignKey(
        "workbench.DecisionJournal", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(option_kind__in=["buy", "lease", "hire", "skip"]),
                name="workbench_investmentanalysis_option_kind_valid",
            )
        ]
