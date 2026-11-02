from django.contrib.gis.db import models
from django.contrib.postgres.fields import DateTimeRangeField
from django.db.models import Q
from apps.core.models import Scoped, Shared, Immutable
from django.contrib.postgres.constraints import ExclusionConstraint
from django.contrib.postgres.fields import RangeOperators


class EventCategory(Shared):
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    maps_to = models.ForeignKey(
        "events.EventCategory", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    is_system = models.BooleanField(default=False)
    sort_order = models.PositiveIntegerField(default=0)
    allowed_sub_event_kinds = models.JSONField(default=dict, blank=True)
    requires_crop_target = models.BooleanField(default=False)
    requires_safety_record = models.BooleanField(default=False)
    creates_stock = models.BooleanField(default=False)
    involves_cash = models.BooleanField(default=False)
    cost_bucket = models.CharField(
        max_length=40,
        choices=[
            ("operation", "operation"),
            ("holding", "holding"),
            ("overhead", "overhead"),
            ("none", "none"),
        ],
        default="operation",
    )

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(cost_bucket__in=["operation", "holding", "overhead", "none"]),
                name="events_eventcategory_cost_bucket_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "code"], name="events_eventcategory_u1", nulls_distinct=False
            ),
        ]

    @property
    def behavior_code(self):
        return self.maps_to.code if self.maps_to_id else self.code


class EventType(Shared):
    category = models.ForeignKey("events.EventCategory", on_delete=models.PROTECT, related_name="+")
    code = models.TextField(blank=True, default="")
    name = models.TextField(blank=True, default="")
    is_active = models.BooleanField(default=True)
    target_kind = models.CharField(
        max_length=40,
        choices=[("crop_cycle", "crop cycle"), ("block", "block"), ("asset", "asset"), ("none", "none")],
        default="crop_cycle",
    )
    allows_multiple_targets = models.BooleanField(default=True)
    default_duration_minutes = models.PositiveIntegerField(default=60)
    min_interval_days = models.PositiveIntegerField(default=0)
    max_repeats_per_cycle = models.PositiveIntegerField(default=None, null=True, blank=True)
    current_version_no = models.PositiveIntegerField(default=1)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(target_kind__in=["crop_cycle", "block", "asset", "none"]),
                name="events_eventtype_target_kind_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "code"], name="events_eventtype_u1", nulls_distinct=False
            ),
        ]


class EventTypeVersion(Shared):
    event_type = models.ForeignKey("events.EventType", on_delete=models.PROTECT, related_name="+")
    version_no = models.PositiveIntegerField(default=1)
    is_current = models.BooleanField(default=True)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.UniqueConstraint(
                fields=["farm", "event_type", "version_no"],
                name="events_eventtypeversion_u0",
                nulls_distinct=False,
            )
        ]


class EventTypeLine(Shared):
    event_type_version = models.ForeignKey(
        "events.EventTypeVersion", on_delete=models.PROTECT, related_name="+"
    )
    line_no = models.PositiveIntegerField(default=0)
    sub_event_kind = models.TextField(blank=True, default="")
    asset_class = models.TextField(blank=True, default="")
    default_asset = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    product_category = models.ForeignKey(
        "catalogue.ProductCategory", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    purpose_tag = models.ForeignKey(
        "catalogue.PurposeTag", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    quantity_basis = models.CharField(
        max_length=40,
        choices=[
            ("per_area", "per area"),
            ("per_machine_hour", "per machine hour"),
            ("fixed", "fixed"),
            ("per_head", "per head"),
            ("derived", "derived"),
        ],
        default="per_area",
    )
    default_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    qty_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    is_required = models.BooleanField(default=True)
    is_locked = models.BooleanField(default=False)

    class Meta(Shared.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    quantity_basis__in=["per_area", "per_machine_hour", "fixed", "per_head", "derived"]
                ),
                name="events_eventtypeline_quantity_basis_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "event_type_version", "line_no"],
                name="events_eventtypeline_u1",
                nulls_distinct=False,
            ),
        ]


class Event(Scoped):
    event_type = models.ForeignKey("events.EventType", on_delete=models.PROTECT, related_name="+")
    event_type_version = models.ForeignKey(
        "events.EventTypeVersion", on_delete=models.PROTECT, related_name="+"
    )
    title = models.TextField(blank=True, default="")
    status = models.CharField(
        max_length=40,
        choices=[
            ("draft", "draft"),
            ("planned", "planned"),
            ("in_progress", "in progress"),
            ("done", "done"),
            ("cancelled", "cancelled"),
        ],
        default="draft",
    )
    planned_start = models.DateTimeField()
    planned_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    trigger_kind = models.CharField(
        max_length=40,
        choices=[
            ("calendar", "calendar"),
            ("observation", "observation"),
            ("manual", "manual"),
            ("system", "system"),
            ("scenario", "scenario"),
        ],
        default="calendar",
    )
    trigger_event = models.ForeignKey(
        "events.Event", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    calendar_item_ref = models.UUIDField(null=True, blank=True)
    scenario_ref = models.UUIDField(null=True, blank=True)
    sequence_in_cycle = models.PositiveIntegerField(default=0)
    planned_cost_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    actual_cost_total = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    notes = models.TextField(blank=True, default="")
    client_uuid = models.UUIDField()
    submitted_by = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    submitted_at = models.DateTimeField(null=True, blank=True)
    confirmed_by = models.ForeignKey(
        "identity.User", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    confirmed_at = models.DateTimeField(null=True, blank=True)
    reversal_of = models.ForeignKey(
        "events.Event", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    request_hash = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(status__in=["draft", "planned", "in_progress", "done", "cancelled"]),
                name="events_event_status_valid",
            ),
            models.CheckConstraint(
                condition=Q(trigger_kind__in=["calendar", "observation", "manual", "system", "scenario"]),
                name="events_event_trigger_kind_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "client_uuid"], name="events_event_u2", nulls_distinct=False
            ),
        ]


class EventTarget(Scoped):
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    crop_cycle = models.ForeignKey(
        "land.CropCycle", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    block = models.ForeignKey("land.Block", on_delete=models.PROTECT, related_name="+", null=True, blank=True)
    asset = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    area_value = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    area_unit = models.ForeignKey(
        "catalogue.Unit", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    area_m2 = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    share_fraction = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    covered_geometry = models.GeometryField(srid=4326, null=True, blank=True)

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(share_fraction__gte=0, share_fraction__lte=1), name="target_share_range"
            )
        ]


class EventExecution(Scoped):
    event = models.OneToOneField("events.Event", on_delete=models.PROTECT, related_name="+")
    operator = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    weather_note = models.TextField(blank=True, default="")
    wind_note = models.TextField(blank=True, default="")
    rain_flag = models.BooleanField(default=False)
    equipment_note = models.TextField(blank=True, default="")


class SubEvent(Scoped):
    event = models.ForeignKey("events.Event", on_delete=models.PROTECT, related_name="+")
    line_no = models.PositiveIntegerField(default=0)
    kind = models.CharField(
        max_length=40,
        choices=[
            ("use_machine", "use machine"),
            ("use_labour", "use labour"),
            ("consume_stock", "consume stock"),
            ("occupy_space", "occupy space"),
            ("produce_stock", "produce stock"),
            ("transfer_stock", "transfer stock"),
            ("adjust_stock", "adjust stock"),
            ("living_gain", "living gain"),
            ("living_loss", "living loss"),
            ("pay", "pay"),
            ("receive", "receive"),
            ("accrue", "accrue"),
            ("acquire_stock", "acquire stock"),
            ("asset_status", "asset status"),
        ],
        default="use_machine",
    )
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    purpose_tag = models.ForeignKey(
        "catalogue.PurposeTag", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    status = models.CharField(
        max_length=40,
        choices=[
            ("planned", "planned"),
            ("reserved", "reserved"),
            ("in_use", "in use"),
            ("done", "done"),
            ("cancelled", "cancelled"),
            ("void", "void"),
        ],
        default="planned",
    )
    planned_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    actual_qty = models.DecimalField(max_digits=14, decimal_places=4, default=0, null=True, blank=True)
    qty_unit = models.ForeignKey("catalogue.Unit", on_delete=models.PROTECT, related_name="+")
    qty_canonical = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    planned_start = models.DateTimeField()
    planned_end = models.DateTimeField()
    actual_start = models.DateTimeField(null=True, blank=True)
    actual_end = models.DateTimeField(null=True, blank=True)
    counterparty = models.ForeignKey(
        "catalogue.Counterparty", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    unit_price = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    amount = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    stock_lot = models.ForeignKey(
        "assets.StockLot", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    capitalize_to_asset = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    operator = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    notes = models.TextField(blank=True, default="")
    client_uuid = models.UUIDField()
    account_id = models.UUIDField(null=True, blank=True)
    ledger_category_id = models.UUIDField(null=True, blank=True)
    destination = models.ForeignKey(
        "assets.Asset", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    grade = models.ForeignKey(
        "catalogue.ProduceGrade", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    expiry_date = models.DateField(null=True, blank=True)
    is_locked = models.BooleanField(default=False)
    is_required = models.BooleanField(default=True)
    capital_terms = models.JSONField(default=dict, blank=True)
    new_asset_status = models.TextField(blank=True, default="")

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    kind__in=[
                        "use_machine",
                        "use_labour",
                        "consume_stock",
                        "occupy_space",
                        "produce_stock",
                        "transfer_stock",
                        "adjust_stock",
                        "living_gain",
                        "living_loss",
                        "pay",
                        "receive",
                        "accrue",
                        "acquire_stock",
                        "asset_status",
                    ]
                ),
                name="events_subevent_kind_valid",
            ),
            models.CheckConstraint(
                condition=Q(status__in=["planned", "reserved", "in_use", "done", "cancelled", "void"]),
                name="events_subevent_status_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "event", "line_no"], name="events_subevent_u2", nulls_distinct=False
            ),
            models.UniqueConstraint(
                fields=["farm", "client_uuid"], name="events_subevent_u3", nulls_distinct=False
            ),
        ]


class Reservation(Scoped):
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    mode = models.CharField(
        max_length=40,
        choices=[("exclusive", "exclusive"), ("shared", "shared"), ("capacity_share", "capacity share")],
        default="exclusive",
    )
    window = DateTimeRangeField()
    qty_reserved = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    status = models.CharField(
        max_length=40,
        choices=[
            ("active", "active"),
            ("released", "released"),
            ("converted", "converted"),
            ("cancelled", "cancelled"),
        ],
        default="active",
    )

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(mode__in=["exclusive", "shared", "capacity_share"]),
                name="events_reservation_mode_valid",
            ),
            models.CheckConstraint(
                condition=Q(status__in=["active", "released", "converted", "cancelled"]),
                name="events_reservation_status_valid",
            ),
        ]


class ObservationDetail(Scoped):
    event = models.OneToOneField("events.Event", on_delete=models.PROTECT, related_name="+")
    observation_kind = models.CharField(
        max_length=40,
        choices=[
            ("growth_stage", "growth stage"),
            ("pest", "pest"),
            ("disease", "disease"),
            ("weed", "weed"),
            ("soil_moisture", "soil moisture"),
            ("nutrient_deficiency", "nutrient deficiency"),
            ("weather_damage", "weather damage"),
            ("general", "general"),
        ],
        default="growth_stage",
    )
    severity = models.PositiveIntegerField(default=0)
    metric_name = models.TextField(blank=True, default="")
    metric_value = models.DecimalField(max_digits=14, decimal_places=4, default=0, null=True, blank=True)
    metric_unit = models.TextField(blank=True, default="")
    stage_code = models.TextField(blank=True, default="")
    location_note = models.TextField(blank=True, default="")
    geotag = models.PointField(srid=4326, null=True, blank=True)
    follow_up_of = models.ForeignKey(
        "events.Event", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    client_uuid = models.UUIDField()

    class Meta(Scoped.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(
                    observation_kind__in=[
                        "growth_stage",
                        "pest",
                        "disease",
                        "weed",
                        "soil_moisture",
                        "nutrient_deficiency",
                        "weather_damage",
                        "general",
                    ]
                ),
                name="events_observationdetail_observation_kind_valid",
            ),
            models.UniqueConstraint(
                fields=["farm", "client_uuid"], name="events_observationdetail_u1", nulls_distinct=False
            ),
        ]


class StockMovement(Immutable):
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    stock_item = models.ForeignKey("assets.StockItem", on_delete=models.PROTECT, related_name="+")
    lot = models.ForeignKey(
        "assets.StockLot", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )
    movement_type = models.CharField(
        max_length=40,
        choices=[("in", "in"), ("out", "out"), ("adjust_in", "adjust in"), ("adjust_out", "adjust out")],
        default="in",
    )
    qty_canonical = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    unit_cost = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    value = models.DecimalField(max_digits=14, decimal_places=2, default=0)
    occurred_at = models.DateTimeField()
    reversal_of = models.ForeignKey(
        "events.StockMovement", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )

    class Meta(Immutable.Meta):
        abstract = False
        constraints = [
            models.CheckConstraint(
                condition=Q(movement_type__in=["in", "out", "adjust_in", "adjust_out"]),
                name="events_stockmovement_movement_type_valid",
            )
        ]


class MeterEntry(Immutable):
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    machine = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    delta_hours = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    reading_after = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    occurred_at = models.DateTimeField()
    reversal_of = models.ForeignKey(
        "events.MeterEntry", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )


class LivingEntry(Immutable):
    sub_event = models.ForeignKey("events.SubEvent", on_delete=models.PROTECT, related_name="+")
    living_asset = models.ForeignKey("assets.Asset", on_delete=models.PROTECT, related_name="+")
    delta_count = models.DecimalField(max_digits=14, decimal_places=4, default=0)
    reason = models.TextField(blank=True, default="")
    occurred_at = models.DateTimeField()
    reversal_of = models.ForeignKey(
        "events.LivingEntry", on_delete=models.PROTECT, related_name="+", null=True, blank=True
    )


Reservation._meta.constraints += [
    ExclusionConstraint(
        name="reservation_no_exclusive_overlap",
        expressions=[("asset", RangeOperators.EQUAL), ("window", RangeOperators.OVERLAPS)],
        condition=Q(status="active", mode="exclusive"),
    )
]
SubEvent._meta.constraints += [
    models.CheckConstraint(
        condition=Q(kind="adjust_stock") | Q(planned_qty__gte=0), name="subevent_quantity_nonnegative"
    )
]
Event._meta.constraints += [
    models.CheckConstraint(condition=Q(planned_end__gt=models.F("planned_start")), name="event_valid_window")
]
Event._meta.indexes += [
    models.Index(fields=["farm", "status", "planned_start"], name="event_farm_status_start")
]
StockMovement._meta.indexes += [models.Index(fields=["stock_item", "occurred_at"], name="stock_item_time")]

Event._meta.original_attrs["constraints"] = Event._meta.constraints
Event._meta.original_attrs["indexes"] = Event._meta.indexes

StockMovement._meta.original_attrs["constraints"] = StockMovement._meta.constraints
StockMovement._meta.original_attrs["indexes"] = StockMovement._meta.indexes
