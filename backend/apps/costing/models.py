from django.contrib.gis.db import models
from django.db.models import Q
from apps.core.models import Scoped, Shared, Immutable
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators, DateRangeField


class CostRule(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    rule_type = models.CharField(
        max_length=40,
        choices=[
            ("hourly_rate", "hourly rate"),
            ("daily_rent", "daily rent"),
            ("wage_per_hour", "wage per hour"),
            ("imputed_labour", "imputed labour"),
            ("stock_average", "stock average"),
            ("flow_estimate", "flow estimate"),
            ("fixed_per_event", "fixed per event"),
        ],
        default="hourly_rate",
    )
    params = models.JSONField(default=dict, blank=True)
    version_no = models.PositiveIntegerField(default=1)
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    is_active = models.BooleanField(default=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    rule_type__in=[
                        "hourly_rate",
                        "daily_rent",
                        "wage_per_hour",
                        "imputed_labour",
                        "stock_average",
                        "flow_estimate",
                        "fixed_per_event",
                    ]
                ),
                name="costing_costrule_rule_type_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "code", "version_no"], name="costing_costrule_u1", nulls_distinct=False
            ),
        ]


class AssetCostRuleAssignment(Scoped):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    cost_rule = models.ForeignKey("costing.CostRule", on_delete=models.PROTECT, related_name="+")
    role = models.CharField(max_length=40, choices=[("use", "use"), ("holding", "holding")], default="use")
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(role__in=["use", "holding"]), name="costing_assetcostruleassignment_role_valid"
            )
        ]


class CostRecord(Immutable):
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    cost_nature = models.CharField(
        max_length=40,
        choices=[
            ("consumption", "consumption"),
            ("machine_use", "machine use"),
            ("depreciation", "depreciation"),
            ("labour", "labour"),
            ("flow", "flow"),
            ("holding", "holding"),
            ("loss", "loss"),
        ],
        default="consumption",
    )
    basis_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    basis_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    rate_used = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    rule = models.ForeignKey(
        "costing.CostRule", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    rule_version_no = models.PositiveIntegerField(default=0, null=True, blank=True)
    occurred_on = models.DateField()
    reversal_of = models.ForeignKey(
        "costing.CostRecord", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    is_imputed = models.BooleanField(default=False)

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    cost_nature__in=[
                        "consumption",
                        "machine_use",
                        "depreciation",
                        "labour",
                        "flow",
                        "holding",
                        "loss",
                    ]
                ),
                name="costing_costrecord_cost_nature_valid",
            )
        ]


class CostAllocation(Immutable):
    cost_record = models.ForeignKey("costing.CostRecord", on_delete=models.PROTECT, related_name="+")
    bucket = models.CharField(
        max_length=40,
        choices=[
            ("operation", "operation"),
            ("holding", "holding"),
            ("idle", "idle"),
            ("overhead", "overhead"),
        ],
        default="operation",
    )
    crop_cycle = models.ForeignKey(
        "land.CropCycle", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    purpose_tag = models.ForeignKey(
        "catalogue.PurposeTag", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    event_target = models.ForeignKey(
        "events.EventTarget", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    share_fraction = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(bucket__in=["operation", "holding", "idle", "overhead"]),
                name="costing_costallocation_bucket_valid",
            )
        ]


class HoldingAccrualRun(Scoped):
    accrual_date = models.DateField()
    status = models.CharField(
        max_length=40, choices=[("running", "running"), ("done", "done")], default="running"
    )
    started_at = models.DateTimeField()
    finished_at = models.DateTimeField(null=True, blank=True)
    rows_created = models.PositiveIntegerField(default=0)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["running", "done"]), name="costing_holdingaccrualrun_status_valid"
            ),
            models.UniqueConstraint(
                fields=["farm", "accrual_date"], name="costing_holdingaccrualrun_u1", nulls_distinct=False
            ),
        ]


class AssetValuation(Scoped):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    as_of_date = models.DateField()
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    basis = models.TextField(blank=True, default="")
    components = models.JSONField(default=dict, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "asset", "as_of_date"], name="costing_assetvaluation_u0", nulls_distinct=False
            )
        ]


class EventCostSummary(Scoped):
    event = models.OneToOneField("events.Event", on_delete=models.PROTECT, related_name="+")
    planned_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    actual_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cost_per_area = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    variance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    breakdown = models.JSONField(default=dict, blank=True)


class CropCycleCostSummary(Scoped):
    crop_cycle = models.ForeignKey("land.CropCycle", on_delete=models.PROTECT, related_name="+")
    as_of_date = models.DateField()
    operation_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    holding_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    revenue = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    margin = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cost_per_area = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    margin_per_area = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    labour_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "crop_cycle", "as_of_date"],
                name="costing_cropcyclecostsummary_u0",
                nulls_distinct=False,
            )
        ]


class ReconciliationRun(Scoped):
    period_start = models.DateField()
    period_end = models.DateField()
    cash_spent_on_assets = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    change_in_register_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    cost_recognised = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    difference = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    status = models.CharField(
        max_length=40, choices=[("balanced", "balanced"), ("off", "off")], default="balanced"
    )
    tolerance = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    details = models.JSONField(default=dict, blank=True)
    run_at = models.DateTimeField()

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["balanced", "off"]), name="costing_reconciliationrun_status_valid"
            )
        ]


class AssetCapitalProfile(Scoped):
    asset = models.OneToOneField("assets.Asset", on_delete=models.PROTECT, related_name="+")
    in_service_date = models.DateField()
    acquisition_cost = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    capital_additions_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    salvage_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    expected_life_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    expected_life_years = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    notes = models.TextField(blank=True, default="")


class DepreciationPolicy(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    strategy_code = models.CharField(
        max_length=40,
        choices=[
            ("units_of_production_hours", "units of production hours"),
            ("straight_line_daily", "straight line daily"),
        ],
        default="units_of_production_hours",
    )
    params = models.JSONField(default=dict, blank=True)
    version_no = models.PositiveIntegerField(default=1)
    is_active = models.BooleanField(default=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(strategy_code__in=["units_of_production_hours", "straight_line_daily"]),
                name="costing_depreciationpolicy_strategy_code_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "code", "version_no"],
                name="costing_depreciationpolicy_u1",
                nulls_distinct=False,
            ),
        ]


class AssetDepreciationAssignment(Scoped):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    policy = models.ForeignKey("costing.DepreciationPolicy", on_delete=models.PROTECT, related_name="+")
    effective_from = models.DateField()
    effective_to = models.DateField(null=True, blank=True)
    base_book_value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    remaining_life_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    remaining_life_years = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    reason = models.TextField(blank=True, default="")


class DepreciationEntry(Immutable):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    assignment = models.ForeignKey(
        "costing.AssetDepreciationAssignment", on_delete=models.PROTECT, related_name="+"
    )
    entry_date = models.DateField()
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    basis_kind = models.CharField(
        max_length=40,
        choices=[("hours", "hours"), ("days", "days"), ("area", "area"), ("other", "other")],
        default="hours",
    )
    basis_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    strategy_code = models.TextField(blank=True, default="")
    policy_version_no = models.PositiveIntegerField(default=0)
    source_sub_event = models.ForeignKey(
        "events.SubEvent", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    cost_record = models.ForeignKey("costing.CostRecord", on_delete=models.PROTECT, related_name="+")
    book_value_after = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    reversal_of = models.ForeignKey(
        "costing.DepreciationEntry", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(basis_kind__in=["hours", "days", "area", "other"]),
                name="costing_depreciationentry_basis_kind_valid",
            )
        ]


AssetDepreciationAssignment._meta.constraints += [
    ExclusionConstraint(
        name="depreciation_no_overlap",
        expressions=[
            ("asset", RangeOperators.EQUAL),
            (
                models.Func(
                    "effective_from",
                    "effective_to",
                    models.Value("[)"),
                    function="DATERANGE",
                    output_field=DateRangeField(),
                ),
                RangeOperators.OVERLAPS,
            ),
        ],
    )
]
CostAllocation._meta.constraints += [
    models.CheckConstraint(condition=Q(share_fraction__gte=0, share_fraction__lte=1), name="cost_share_valid")
]

AssetDepreciationAssignment._meta.original_attrs["constraints"] = (
    AssetDepreciationAssignment._meta.constraints
)
AssetDepreciationAssignment._meta.original_attrs["indexes"] = AssetDepreciationAssignment._meta.indexes


class PrepaidEntry(Immutable):
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    amount = models.DecimalField(max_digits=14, decimal_places=2)
    entry_date = models.DateField()
    reversal_of = models.ForeignKey("self", null=True, blank=True, on_delete=models.PROTECT, related_name="+")
