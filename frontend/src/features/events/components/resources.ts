import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "categories",
    title: "Categories",
    model: "events.EventCategory",
    editable: false,
    versioned: false,
    columns: ["name", "code", "created_at"],
    fields: [
      {
        name: "code",
        label: "Code",
        required: true,
        type: "text",
      },
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "sort_order",
        label: "Sort order",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "allowed_sub_event_kinds",
        label: "Allowed sub event kinds",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "requires_crop_target",
        label: "Requires crop target",
        required: false,
        type: "boolean",
      },
      {
        name: "requires_safety_record",
        label: "Requires safety record",
        required: false,
        type: "boolean",
      },
      {
        name: "creates_stock",
        label: "Creates stock",
        required: false,
        type: "boolean",
      },
      {
        name: "involves_cash",
        label: "Involves cash",
        required: false,
        type: "boolean",
      },
      {
        name: "cost_bucket",
        label: "Cost bucket",
        required: false,
        type: "select",
        options: [
          {
            value: "operation",
            label: "Operation",
          },
          {
            value: "holding",
            label: "Holding",
          },
          {
            value: "overhead",
            label: "Overhead",
          },
          {
            value: "none",
            label: "None",
          },
        ],
      },
      {
        name: "maps_to",
        label: "Maps to",
        required: false,
        type: "reference",
        resource: "categories",
      },
    ],
    relations: {
      maps_to: "categories",
    },
  },
  {
    key: "types",
    title: "Types",
    model: "events.EventType",
    editable: false,
    versioned: false,
    columns: ["name", "code", "created_at"],
    fields: [
      {
        name: "code",
        label: "Code",
        required: true,
        type: "text",
      },
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "target_kind",
        label: "Target kind",
        required: false,
        type: "select",
        options: [
          {
            value: "crop_cycle",
            label: "Crop cycle",
          },
          {
            value: "block",
            label: "Block",
          },
          {
            value: "asset",
            label: "Asset",
          },
          {
            value: "none",
            label: "None",
          },
        ],
      },
      {
        name: "allows_multiple_targets",
        label: "Allows multiple targets",
        required: false,
        type: "boolean",
      },
      {
        name: "default_duration_minutes",
        label: "Default duration minutes",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "min_interval_days",
        label: "Min interval days",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "max_repeats_per_cycle",
        label: "Max repeats per cycle",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "current_version_no",
        label: "Current version no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "category",
        label: "Category",
        required: false,
        type: "reference",
        resource: "categories",
      },
    ],
    relations: {
      category: "categories",
    },
  },
  {
    key: "type-versions",
    title: "Type versions",
    model: "events.EventTypeVersion",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "version_no",
        label: "Version no",
        required: false,
        type: "number",
        step: "1",
        default: 1,
      },
      {
        name: "is_current",
        label: "Is current",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "event_type",
        label: "Event type",
        required: false,
        type: "reference",
        resource: "types",
      },
    ],
    relations: {
      event_type: "types",
    },
  },
  {
    key: "type-lines",
    title: "Type lines",
    model: "events.EventTypeLine",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "line_no",
        label: "Line no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "sub_event_kind",
        label: "Sub event kind",
        required: false,
        type: "text",
      },
      {
        name: "asset_class",
        label: "Asset class",
        required: false,
        type: "text",
      },
      {
        name: "quantity_basis",
        label: "Quantity basis",
        required: false,
        type: "select",
        options: [
          {
            value: "per_area",
            label: "Per area",
          },
          {
            value: "per_machine_hour",
            label: "Per machine hour",
          },
          {
            value: "fixed",
            label: "Fixed",
          },
          {
            value: "per_head",
            label: "Per head",
          },
          {
            value: "derived",
            label: "Derived",
          },
        ],
      },
      {
        name: "default_qty",
        label: "Default qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "is_required",
        label: "Is required",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "is_locked",
        label: "Is locked",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "event_type_version",
        label: "Event type version",
        required: false,
        type: "reference",
        resource: "type-versions",
      },
      {
        name: "default_asset",
        label: "Default asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "product_category",
        label: "Product category",
        required: false,
        type: "reference",
        resource: "product-categories",
      },
      {
        name: "purpose_tag",
        label: "Purpose tag",
        required: false,
        type: "reference",
        resource: "purpose-tags",
      },
      {
        name: "qty_unit",
        label: "Qty unit",
        required: false,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      event_type_version: "type-versions",
      default_asset: "assets",
      product_category: "product-categories",
      purpose_tag: "purpose-tags",
      qty_unit: "units",
    },
  },
  {
    key: "events",
    title: "Events",
    model: "events.Event",
    editable: false,
    versioned: false,
    columns: ["title", "status", "planned_start", "actual_cost_total"],
    fields: [
      {
        name: "title",
        label: "Title",
        required: false,
        type: "text",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "draft",
            label: "Draft",
          },
          {
            value: "planned",
            label: "Planned",
          },
          {
            value: "in_progress",
            label: "In progress",
          },
          {
            value: "done",
            label: "Done",
          },
          {
            value: "cancelled",
            label: "Cancelled",
          },
        ],
      },
      {
        name: "planned_start",
        label: "Planned start",
        required: false,
        type: "datetime-local",
      },
      {
        name: "planned_end",
        label: "Planned end",
        required: false,
        type: "datetime-local",
      },
      {
        name: "actual_start",
        label: "Actual start",
        required: false,
        type: "datetime-local",
      },
      {
        name: "actual_end",
        label: "Actual end",
        required: false,
        type: "datetime-local",
      },
      {
        name: "trigger_kind",
        label: "Trigger kind",
        required: false,
        type: "select",
        options: [
          {
            value: "calendar",
            label: "Calendar",
          },
          {
            value: "observation",
            label: "Observation",
          },
          {
            value: "manual",
            label: "Manual",
          },
          {
            value: "system",
            label: "System",
          },
          {
            value: "scenario",
            label: "Scenario",
          },
        ],
      },
      {
        name: "calendar_item_ref",
        label: "Calendar item ref",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "scenario_ref",
        label: "Scenario ref",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "sequence_in_cycle",
        label: "Sequence in cycle",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "planned_cost_total",
        label: "Planned cost total",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "actual_cost_total",
        label: "Actual cost total",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
      {
        name: "client_uuid",
        label: "Client uuid",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "submitted_at",
        label: "Submitted at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "confirmed_at",
        label: "Confirmed at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "request_hash",
        label: "Request hash",
        required: false,
        type: "text",
      },
      {
        name: "event_type",
        label: "Event type",
        required: false,
        type: "reference",
        resource: "types",
      },
      {
        name: "event_type_version",
        label: "Event type version",
        required: false,
        type: "reference",
        resource: "type-versions",
      },
      {
        name: "trigger_event",
        label: "Trigger event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "submitted_by",
        label: "Submitted by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "confirmed_by",
        label: "Confirmed by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "events",
      },
    ],
    relations: {
      event_type: "types",
      event_type_version: "type-versions",
      trigger_event: "events",
      reversal_of: "events",
    },
  },
  {
    key: "sub-events",
    title: "Sub events",
    model: "events.SubEvent",
    editable: false,
    versioned: false,
    columns: ["asset", "event", "status", "amount", "created_at"],
    fields: [
      {
        name: "line_no",
        label: "Line no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "use_machine",
            label: "Use machine",
          },
          {
            value: "use_labour",
            label: "Use labour",
          },
          {
            value: "consume_stock",
            label: "Consume stock",
          },
          {
            value: "occupy_space",
            label: "Occupy space",
          },
          {
            value: "produce_stock",
            label: "Produce stock",
          },
          {
            value: "transfer_stock",
            label: "Transfer stock",
          },
          {
            value: "adjust_stock",
            label: "Adjust stock",
          },
          {
            value: "living_gain",
            label: "Living gain",
          },
          {
            value: "living_loss",
            label: "Living loss",
          },
          {
            value: "pay",
            label: "Pay",
          },
          {
            value: "receive",
            label: "Receive",
          },
          {
            value: "accrue",
            label: "Accrue",
          },
          {
            value: "acquire_stock",
            label: "Acquire stock",
          },
          {
            value: "asset_status",
            label: "Asset status",
          },
        ],
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "planned",
            label: "Planned",
          },
          {
            value: "reserved",
            label: "Reserved",
          },
          {
            value: "in_use",
            label: "In use",
          },
          {
            value: "done",
            label: "Done",
          },
          {
            value: "cancelled",
            label: "Cancelled",
          },
          {
            value: "void",
            label: "Void",
          },
        ],
      },
      {
        name: "planned_qty",
        label: "Planned qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "actual_qty",
        label: "Actual qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "qty_canonical",
        label: "Qty canonical",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "planned_start",
        label: "Planned start",
        required: false,
        type: "datetime-local",
      },
      {
        name: "planned_end",
        label: "Planned end",
        required: false,
        type: "datetime-local",
      },
      {
        name: "actual_start",
        label: "Actual start",
        required: false,
        type: "datetime-local",
      },
      {
        name: "actual_end",
        label: "Actual end",
        required: false,
        type: "datetime-local",
      },
      {
        name: "unit_price",
        label: "Unit price",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "amount",
        label: "Amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
      {
        name: "client_uuid",
        label: "Client uuid",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "account_id",
        label: "Account id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "ledger_category_id",
        label: "Ledger category id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "expiry_date",
        label: "Expiry date",
        required: false,
        type: "date",
      },
      {
        name: "is_locked",
        label: "Is locked",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "is_required",
        label: "Is required",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "capital_terms",
        label: "Capital terms",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "new_asset_status",
        label: "New asset status",
        required: false,
        type: "text",
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "purpose_tag",
        label: "Purpose tag",
        required: false,
        type: "reference",
        resource: "purpose-tags",
      },
      {
        name: "qty_unit",
        label: "Qty unit",
        required: false,
        type: "reference",
        resource: "units",
      },
      {
        name: "counterparty",
        label: "Counterparty",
        required: false,
        type: "reference",
        resource: "counterparties",
      },
      {
        name: "stock_lot",
        label: "Stock lot",
        required: false,
        type: "reference",
        resource: "stock-lots",
      },
      {
        name: "capitalize_to_asset",
        label: "Capitalize to asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "operator",
        label: "Operator",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "destination",
        label: "Destination",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "grade",
        label: "Grade",
        required: false,
        type: "reference",
        resource: "grades",
      },
    ],
    relations: {
      event: "events",
      asset: "assets",
      purpose_tag: "purpose-tags",
      qty_unit: "units",
      counterparty: "counterparties",
      stock_lot: "stock-lots",
      capitalize_to_asset: "assets",
      operator: "assets",
      destination: "assets",
      grade: "grades",
    },
  },
  {
    key: "targets",
    title: "Targets",
    model: "events.EventTarget",
    editable: false,
    versioned: false,
    columns: ["asset", "event", "crop_cycle", "created_at"],
    fields: [
      {
        name: "area_value",
        label: "Area value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "share_fraction",
        label: "Share fraction",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "covered_geometry",
        label: "Covered geometry",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "area_unit",
        label: "Area unit",
        required: false,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      event: "events",
      crop_cycle: "crop-cycles",
      block: "blocks",
      asset: "assets",
      area_unit: "units",
    },
  },
  {
    key: "executions",
    title: "Executions",
    model: "events.EventExecution",
    editable: false,
    versioned: false,
    columns: ["event", "created_at"],
    fields: [
      {
        name: "weather_note",
        label: "Weather note",
        required: false,
        type: "text",
      },
      {
        name: "wind_note",
        label: "Wind note",
        required: false,
        type: "text",
      },
      {
        name: "rain_flag",
        label: "Rain flag",
        required: false,
        type: "boolean",
      },
      {
        name: "equipment_note",
        label: "Equipment note",
        required: false,
        type: "text",
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "operator",
        label: "Operator",
        required: false,
        type: "reference",
        resource: "assets",
      },
    ],
    relations: {
      event: "events",
      operator: "assets",
    },
  },
  {
    key: "reservations",
    title: "Reservations",
    model: "events.Reservation",
    editable: false,
    versioned: false,
    columns: ["asset", "status", "created_at"],
    fields: [
      {
        name: "mode",
        label: "Mode",
        required: false,
        type: "select",
        options: [
          {
            value: "exclusive",
            label: "Exclusive",
          },
          {
            value: "shared",
            label: "Shared",
          },
          {
            value: "capacity_share",
            label: "Capacity share",
          },
        ],
      },
      {
        name: "window",
        label: "Window",
        required: false,
        type: "object",
        fields: [
          {
            name: "start",
            label: "Starts",
            type: "datetime-local",
            required: true,
          },
          {
            name: "end",
            label: "Ends",
            type: "datetime-local",
            required: true,
          },
        ],
      },
      {
        name: "qty_reserved",
        label: "Qty reserved",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "active",
            label: "Active",
          },
          {
            value: "released",
            label: "Released",
          },
          {
            value: "converted",
            label: "Converted",
          },
          {
            value: "cancelled",
            label: "Cancelled",
          },
        ],
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
    ],
    relations: {
      sub_event: "sub-events",
      asset: "assets",
    },
  },
  {
    key: "observations",
    title: "Observations",
    model: "events.ObservationDetail",
    editable: false,
    versioned: false,
    columns: [
      "event",
      "observation_kind",
      "severity",
      "metric_name",
      "metric_value",
    ],
    fields: [
      {
        name: "observation_kind",
        label: "Observation kind",
        required: false,
        type: "select",
        options: [
          {
            value: "growth_stage",
            label: "Growth stage",
          },
          {
            value: "pest",
            label: "Pest",
          },
          {
            value: "disease",
            label: "Disease",
          },
          {
            value: "weed",
            label: "Weed",
          },
          {
            value: "soil_moisture",
            label: "Soil moisture",
          },
          {
            value: "nutrient_deficiency",
            label: "Nutrient deficiency",
          },
          {
            value: "weather_damage",
            label: "Weather damage",
          },
          {
            value: "general",
            label: "General",
          },
        ],
      },
      {
        name: "severity",
        label: "Severity",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "metric_name",
        label: "Metric name",
        required: false,
        type: "text",
      },
      {
        name: "metric_value",
        label: "Metric value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "metric_unit",
        label: "Metric unit",
        required: false,
        type: "text",
      },
      {
        name: "stage_code",
        label: "Stage code",
        required: false,
        type: "text",
      },
      {
        name: "location_note",
        label: "Location note",
        required: false,
        type: "text",
      },
      {
        name: "geotag",
        label: "Geotag",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "client_uuid",
        label: "Client uuid",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "follow_up_of",
        label: "Follow up of",
        required: false,
        type: "reference",
        resource: "events",
      },
    ],
    relations: {
      event: "events",
      follow_up_of: "events",
    },
  },
  {
    key: "stock-movements",
    title: "Stock movements",
    model: "events.StockMovement",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "movement_type",
        label: "Movement type",
        required: false,
        type: "select",
        options: [
          {
            value: "in",
            label: "In",
          },
          {
            value: "out",
            label: "Out",
          },
          {
            value: "adjust_in",
            label: "Adjust in",
          },
          {
            value: "adjust_out",
            label: "Adjust out",
          },
        ],
      },
      {
        name: "qty_canonical",
        label: "Qty canonical",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "unit_cost",
        label: "Unit cost",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "value",
        label: "Value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "occurred_at",
        label: "Occurred at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "stock_item",
        label: "Stock item",
        required: false,
        type: "reference",
        resource: "stock-items",
      },
      {
        name: "lot",
        label: "Lot",
        required: false,
        type: "reference",
        resource: "stock-lots",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "stock-movements",
      },
    ],
    relations: {
      sub_event: "sub-events",
      stock_item: "stock-items",
      lot: "stock-lots",
      reversal_of: "stock-movements",
    },
  },
  {
    key: "meter-entries",
    title: "Meter entries",
    model: "events.MeterEntry",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "delta_hours",
        label: "Delta hours",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "reading_after",
        label: "Reading after",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "occurred_at",
        label: "Occurred at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "machine",
        label: "Machine",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "meter-entries",
      },
    ],
    relations: {
      sub_event: "sub-events",
      machine: "assets",
      reversal_of: "meter-entries",
    },
  },
  {
    key: "living-entries",
    title: "Living entries",
    model: "events.LivingEntry",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "delta_count",
        label: "Delta count",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
      },
      {
        name: "occurred_at",
        label: "Occurred at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "living_asset",
        label: "Living asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "living-entries",
      },
    ],
    relations: {
      sub_event: "sub-events",
      living_asset: "assets",
      reversal_of: "living-entries",
    },
  },
];

resources
  .filter((r) => r.key === "events")
  .forEach((r) => {
    r.createCommand = "create_event";
  });

resources
  .filter((r) => r.key === "types")
  .forEach((r) => {
    r.createCommand = "save_type";
  });

resources
  .filter((r) => r.key === "categories")
  .forEach((r) => {
    r.createCommand = "create_category";
  });

resources
  .filter((r) => r.key === "observations")
  .forEach((r) => {
    r.createCommand = "record_observation";
  });

resources
  .filter((r) => r.key === "crop-cycles")
  .forEach((r) => {
    r.createCommand = "create_crop_cycle";
  });

resources
  .filter((r) => r.key === "stage-records")
  .forEach((r) => {
    r.createCommand = "record_stage";
  });

resources
  .filter((r) => r.key === "entries")
  .forEach((r) => {
    r.createCommand = "record_payment";
  });

resources
  .filter((r) => r.key === "invitations")
  .forEach((r) => {
    r.createCommand = "invite";
  });

resources
  .filter((r) => r.key === "roles")
  .forEach((r) => {
    r.createCommand = "create_role";
  });

resources
  .filter((r) => r.key === "depreciation-assignments")
  .forEach((r) => {
    r.createCommand = "change_depreciation_policy";
  });

for (const resource of resources) {
  for (const f of resource.fields) {
    if (["asset", "base_unit"].includes(f.name)) f.immutable = true;
  }
}

const priority = ["events", "observations", "types", "categories"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
