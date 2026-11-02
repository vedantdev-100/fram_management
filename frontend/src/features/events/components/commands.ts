import { localDateTime as commandClock } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import type { CommandDefinition } from "@/types";
import { localDateTime } from "@/lib/format";
export const commands: CommandDefinition[] = [
  {
    key: "create_category",
    label: "Create a work category",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "code",
        label: "Code",
        type: "text",
        required: true,
      },
      {
        name: "name",
        label: "Name",
        type: "text",
        required: true,
        default: "Local nutrition category",
      },
      {
        name: "maps_to",
        label: "Maps to",
        type: "reference",
        required: true,
        resource: "categories",
      },
    ],
    resource: "categories",
    build: (values) => ({ ...values }),
  },
  {
    key: "save_type",
    label: "Create or revise a work template",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "type",
        label: "Type",
        type: "object",
        required: true,
        fields: [
          {
            name: "category",
            label: "Category",
            type: "reference",
            required: true,
            resource: "categories",
          },
          {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
          },
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            default: "Local input operation",
          },
          {
            name: "target_kind",
            label: "Target kind",
            type: "select",
            required: true,
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
            default: "crop_cycle",
          },
          {
            name: "allows_multiple_targets",
            label: "Allows multiple targets",
            type: "boolean",
            required: true,
            default: true,
          },
          {
            name: "default_duration_minutes",
            label: "Default duration minutes",
            type: "number",
            required: true,
            step: "any",
            default: 60,
          },
          {
            name: "lines",
            label: "Lines",
            type: "array",
            required: true,
            fields: [
              {
                name: "line_no",
                label: "Line no",
                type: "number",
                required: true,
                step: "any",
                default: 1,
              },
              {
                name: "sub_event_kind",
                label: "Sub event kind",
                type: "select",
                required: true,
                options: [
                  {
                    value: "consume_stock",
                    label: "Consume stock",
                  },
                  {
                    value: "use_machine",
                    label: "Use machine",
                  },
                  {
                    value: "use_labour",
                    label: "Use labour",
                  },
                  {
                    value: "produce_stock",
                    label: "Produce stock",
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
                    value: "occupy_space",
                    label: "Occupy space",
                  },
                ],
                default: "consume_stock",
              },
              {
                name: "asset_class",
                label: "Asset class",
                type: "select",
                required: true,
                options: [
                  {
                    value: "space",
                    label: "Space",
                  },
                  {
                    value: "machine",
                    label: "Machine",
                  },
                  {
                    value: "person",
                    label: "Person",
                  },
                  {
                    value: "stock",
                    label: "Stock",
                  },
                  {
                    value: "living",
                    label: "Living",
                  },
                  {
                    value: "flow",
                    label: "Flow",
                  },
                ],
                default: "stock",
              },
              {
                name: "default_asset",
                label: "Default asset",
                type: "reference",
                required: true,
                resource: "assets",
              },
              {
                name: "purpose_tag",
                label: "Purpose tag",
                type: "reference",
                required: true,
                resource: "purpose-tags",
              },
              {
                name: "quantity_basis",
                label: "Quantity basis",
                type: "select",
                required: true,
                options: [
                  {
                    value: "fixed",
                    label: "Fixed",
                  },
                  {
                    value: "per_area",
                    label: "Per area",
                  },
                  {
                    value: "per_machine_hour",
                    label: "Per machine hour",
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
                default: "fixed",
              },
              {
                name: "default_qty",
                label: "Default qty",
                type: "number",
                required: true,
                step: "any",
                default: "1",
              },
              {
                name: "qty_unit",
                label: "Qty unit",
                type: "reference",
                required: true,
                resource: "units",
              },
              {
                name: "is_required",
                label: "Is required",
                type: "boolean",
                required: true,
                default: true,
              },
              {
                name: "is_locked",
                label: "Is locked",
                type: "boolean",
                required: true,
                default: false,
              },
            ],
            default: [{}],
          },
        ],
      },
    ],
    resource: "types",
    build: (values) => ({ ...values }),
  },
  {
    key: "duplicate_event",
    label: "Copy work to a new plan",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "planned_start",
        label: "Planned start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "planned_end",
        label: "Planned end",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "draft",
        label: "Draft",
        type: "boolean",
        required: true,
        default: true,
      },
    ],
    resource: "events",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
  {
    key: "set_execution",
    label: "Record field conditions",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "execution",
        label: "Execution",
        type: "object",
        required: true,
        fields: [
          {
            name: "operator",
            label: "Operator",
            type: "reference",
            required: true,
            resource: "assets",
          },
          {
            name: "weather_note",
            label: "Weather note",
            type: "textarea",
            required: true,
            default: "Clear",
          },
          {
            name: "wind_note",
            label: "Wind note",
            type: "textarea",
            required: true,
            default: "Record actual conditions",
          },
          {
            name: "rain_flag",
            label: "Rain flag",
            type: "boolean",
            required: true,
            default: false,
          },
        ],
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "create_event",
    label: "Plan work",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "title",
        label: "Work title",
        type: "text",
        required: true,
      },
      {
        name: "event_type",
        label: "Event type",
        type: "reference",
        required: true,
        resource: "types",
      },
      {
        name: "planned_start",
        label: "Planned start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "planned_end",
        label: "Planned end",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "lines",
        label: "Lines",
        type: "array",
        required: true,
        fields: [
          {
            name: "kind",
            label: "Kind",
            type: "select",
            required: true,
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
                value: "acquire_stock",
                label: "Acquire stock",
              },
              {
                value: "asset_status",
                label: "Asset status",
              },
            ],
            default: "consume_stock",
          },
          {
            name: "asset",
            label: "Asset",
            type: "reference",
            required: true,
            resource: "assets",
          },
          {
            name: "planned_qty",
            label: "Planned qty",
            type: "number",
            required: true,
            step: "any",
          },
          {
            name: "qty_unit",
            label: "Qty unit",
            type: "reference",
            required: true,
            resource: "units",
          },
          {
            name: "purpose_tag",
            label: "Purpose tag",
            type: "reference",
            required: true,
            resource: "purpose-tags",
          },
        ],
        default: [{}],
      },
      {
        name: "targets",
        label: "Targets",
        type: "array",
        required: true,
        fields: [
          {
            name: "crop_cycle",
            label: "Crop cycle",
            type: "reference",
            required: true,
            resource: "crop-cycles",
          },
          {
            name: "block",
            label: "Block",
            type: "reference",
            required: true,
            resource: "blocks",
          },
          {
            name: "area_value",
            label: "Area value",
            type: "number",
            required: true,
            step: "any",
            default: "2",
          },
          {
            name: "area_unit",
            label: "Area unit",
            type: "reference",
            required: true,
            resource: "units",
          },
        ],
        default: [{}],
      },
    ],
    resource: "events",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
  {
    key: "plan_event",
    label: "Commit a draft plan",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires a draft event.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "start_event",
    label: "Start work",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires a planned event.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "cancel_event",
    label: "Cancel planned work",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "reschedule_event",
    label: "Move a booking",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "start",
        label: "Start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "end",
        label: "End",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "submit_event",
    label: "Submit actuals",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires an in-progress event. Planned quantities are default actuals. Refresh the event version after every successful transition.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "corrections",
        label: "Corrections",
        type: "json",
        required: true,
        default: {},
        help: "Leave empty to use planned values. Actual quantities and times only.",
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "confirm_event",
    label: "Confirm completed work",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires an in-progress event. Planned quantities are default actuals. Refresh the event version after every successful transition.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "corrections",
        label: "Corrections",
        type: "json",
        required: true,
        default: {},
        help: "Leave empty to use planned values. Actual quantities and times only.",
      },
    ],
    resource: "events",
    build: (values) => ({ ...values }),
  },
  {
    key: "amend_event",
    label: "Correct completed work",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Restricted reversal support applies: no capital/disposal reversal; see backend IMPLEMENTATION_STATUS.md.",
    fields: [
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "reason",
        label: "Reason",
        type: "textarea",
        required: true,
        default: "Correct a recorded quantity",
      },
      {
        name: "replacement",
        label: "Replacement",
        type: "object",
        required: true,
        fields: [
          {
            name: "event_type",
            label: "Event type",
            type: "reference",
            required: true,
            resource: "types",
          },
          {
            name: "planned_start",
            label: "Planned start",
            type: "datetime-local",
            required: true,
            default: () => localDateTime(new Date().toISOString()),
          },
          {
            name: "planned_end",
            label: "Planned end",
            type: "datetime-local",
            required: true,
            default: () => localDateTime(new Date().toISOString()),
          },
          {
            name: "lines",
            label: "Lines",
            type: "array",
            required: true,
            fields: [
              {
                name: "kind",
                label: "Kind",
                type: "select",
                required: true,
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
                    value: "acquire_stock",
                    label: "Acquire stock",
                  },
                  {
                    value: "asset_status",
                    label: "Asset status",
                  },
                ],
                default: "consume_stock",
              },
              {
                name: "asset",
                label: "Asset",
                type: "reference",
                required: true,
                resource: "assets",
              },
              {
                name: "planned_qty",
                label: "Planned qty",
                type: "number",
                required: true,
                step: "any",
                default: "17",
              },
              {
                name: "qty_unit",
                label: "Qty unit",
                type: "reference",
                required: true,
                resource: "units",
              },
            ],
            default: [{}],
          },
          {
            name: "targets",
            label: "Targets",
            type: "array",
            required: true,
            fields: [
              {
                name: "crop_cycle",
                label: "Crop cycle",
                type: "reference",
                required: true,
                resource: "crop-cycles",
              },
              {
                name: "block",
                label: "Block",
                type: "reference",
                required: true,
                resource: "blocks",
              },
              {
                name: "area_value",
                label: "Area value",
                type: "number",
                required: true,
                step: "any",
                default: "2",
              },
              {
                name: "area_unit",
                label: "Area unit",
                type: "reference",
                required: true,
                resource: "units",
              },
            ],
            default: [{}],
          },
        ],
      },
    ],
    resource: "events",
    build: (values) => ({
      ...values,
      replacement: {
        ...(values.replacement as Record<string, unknown>),
        client_uuid: values.client_uuid || uuid(),
      },
    }),
  },
  {
    key: "record_observation",
    label: "Record an observation",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_type",
        label: "Event type",
        type: "reference",
        required: true,
        resource: "types",
      },
      {
        name: "planned_start",
        label: "Planned start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "planned_end",
        label: "Planned end",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "lines",
        label: "Lines",
        type: "array",
        required: true,
        fields: [],
        default: [],
      },
      {
        name: "targets",
        label: "Targets",
        type: "array",
        required: true,
        fields: [
          {
            name: "crop_cycle",
            label: "Crop cycle",
            type: "reference",
            required: true,
            resource: "crop-cycles",
          },
          {
            name: "block",
            label: "Block",
            type: "reference",
            required: true,
            resource: "blocks",
          },
          {
            name: "area_value",
            label: "Area value",
            type: "number",
            required: true,
            step: "any",
            default: "2",
          },
          {
            name: "area_unit",
            label: "Area unit",
            type: "reference",
            required: true,
            resource: "units",
          },
        ],
        default: [{}],
      },
      {
        name: "observation",
        label: "Observation",
        type: "object",
        required: true,
        fields: [
          {
            name: "observation_kind",
            label: "Observation kind",
            type: "select",
            required: true,
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
            default: "general",
          },
          {
            name: "severity",
            label: "Severity",
            type: "number",
            required: true,
            step: "any",
            default: 1,
          },
          {
            name: "metric_name",
            label: "Metric name",
            type: "text",
            required: true,
            default: "field_note",
          },
          {
            name: "location_note",
            label: "Location note",
            type: "textarea",
            required: true,
            default: "Local test observation",
          },
        ],
      },
    ],
    resource: "observations",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
  {
    key: "adjust_stock",
    label: "Record a stock count",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_type",
        label: "Event type",
        type: "reference",
        required: true,
        resource: "types",
      },
      {
        name: "planned_start",
        label: "Planned start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "planned_end",
        label: "Planned end",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "lines",
        label: "Lines",
        type: "array",
        required: true,
        fields: [
          {
            name: "kind",
            label: "Kind",
            type: "select",
            required: true,
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
                value: "acquire_stock",
                label: "Acquire stock",
              },
              {
                value: "asset_status",
                label: "Asset status",
              },
            ],
            default: "adjust_stock",
          },
          {
            name: "asset",
            label: "Asset",
            type: "reference",
            required: true,
            resource: "assets",
          },
          {
            name: "planned_qty",
            label: "Planned qty",
            type: "number",
            required: true,
            step: "any",
            default: "-1",
          },
          {
            name: "qty_unit",
            label: "Qty unit",
            type: "reference",
            required: true,
            resource: "units",
          },
          {
            name: "notes",
            label: "Notes",
            type: "textarea",
            required: true,
            default: "Explicit stock-count loss",
          },
        ],
        default: [{}],
      },
    ],
    resource: "events",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
];

const labels: Record<string, string> = {
  event_id: "Work record",
  event_type: "Work template",
  block_id: "Land block",
  cycle_id: "Crop cycle",
  qty_unit: "Unit",
  planned_qty: "Planned quantity",
  asset: "Resource",
  area_value: "Covered area",
  area_unit: "Area unit",
  scenario_id: "Scenario",
  policy_id: "Depreciation policy",
  version: "Current record version",
};
function nameFields(fields: import("@/types").Field[]) {
  for (const f of fields) {
    if (labels[f.name]) f.label = labels[f.name];
    if (f.fields) nameFields(f.fields);
  }
}
commands.forEach((c) => nameFields(c.fields));

commands
  .filter((c) =>
    [
      "create_event",
      "record_observation",
      "adjust_stock",
      "duplicate_event",
      "record_payment",
      "ledger_transfer",
      "amend_event",
    ].includes(c.key),
  )
  .forEach((c) => {
    c.idempotent = true;
  });

const descriptions: Record<string, string> = {
  create_event:
    "Choose the work, its time window and the resources you expect to use. Actual use is recorded when the work is confirmed.",
  plan_event:
    "Commit a draft operation and check that its resources are available.",
  start_event:
    "Mark this operation as started. You can record actual quantities before confirmation.",
  submit_event:
    "Send the actual quantities for review. Depending on farm preferences, a supervisor may need to confirm them.",
  confirm_event:
    "Confirm completed work. This records resource use, costs and any linked money movements.",
  cancel_event: "Cancel an unfinished operation and release its reservations.",
  reschedule_event:
    "Move an unfinished operation to a new time window. Resource availability is checked again.",
  amend_event:
    "Correct a confirmed operation with a reason and a replacement plan. Some capital and disposal corrections require additional backend support.",
  duplicate_event:
    "Copy this work into a new plan without changing the original record.",
  set_execution:
    "Record who operated the equipment and the actual conditions in the field.",
  record_observation:
    "Record what you saw in the field. An observation can support a stage update or a suggested follow-up.",
  adjust_stock:
    "Record a stock count difference or loss explicitly. Use a signed quantity and explain the reason.",
  save_type:
    "Define a reusable work template. Revising an existing template creates a new version while past records keep their history.",
  create_category:
    "Create a farm-specific work category based on an existing system category.",
};
commands.forEach((c) => {
  c.description = descriptions[c.key] || c.description;
});

function setWindowDefaults(fields: import("@/types").Field[]) {
  for (const f of fields) {
    if (
      f.type === "datetime-local" &&
      ["planned_end", "actual_end", "end"].includes(f.name)
    )
      f.default = () =>
        commandClock(new Date(Date.now() + 3600000).toISOString());
    if (["purpose_tag", "targets"].includes(f.name)) f.required = false;
    if (f.fields) setWindowDefaults(f.fields);
  }
}
commands.forEach((c) => setWindowDefaults(c.fields));

const resourceLines: import("@/types").Field[] = [
  {
    name: "kind",
    label: "Resource use",
    type: "select",
    required: true,
    default: "consume_stock",
    options: [
      ["consume_stock", "Use stock"],
      ["use_machine", "Use a machine"],
      ["use_labour", "Labour hours"],
      ["occupy_space", "Occupy space"],
      ["produce_stock", "Harvest / produce stock"],
      ["acquire_stock", "Purchase stock"],
      ["transfer_stock", "Move or sell stock"],
      ["adjust_stock", "Stock count difference"],
      ["living_gain", "Living gain"],
      ["living_loss", "Living loss"],
      ["pay", "Money paid"],
      ["receive", "Money received"],
      ["asset_status", "Asset status change"],
    ].map(([value, label]) => ({ value, label })),
  },
  {
    name: "asset",
    label: "Resource",
    type: "reference",
    resource: "assets",
    required: true,
  },
  {
    name: "planned_qty",
    label: "Planned quantity",
    type: "number",
    step: "any",
    required: true,
  },
  {
    name: "qty_unit",
    label: "Unit",
    type: "reference",
    resource: "units",
    required: true,
  },
  {
    name: "purpose_tag",
    label: "Purpose",
    type: "reference",
    resource: "purpose-tags",
  },
  {
    name: "operator",
    label: "Operator (person asset)",
    type: "reference",
    resource: "assets",
    when: { field: "kind", in: ["use_machine"] },
  },
  {
    name: "unit_price",
    label: "Price per entered unit",
    type: "number",
    step: "any",
    required: true,
    when: { field: "kind", in: ["acquire_stock"] },
  },
  {
    name: "amount",
    label: "Money amount",
    type: "number",
    step: "any",
    required: true,
    when: { field: "kind", in: ["pay", "receive"] },
  },
  {
    name: "account_id",
    label: "Money account",
    type: "reference",
    resource: "accounts",
    required: true,
    when: { field: "kind", in: ["pay", "receive"] },
  },
  {
    name: "ledger_category_id",
    label: "Money category",
    type: "reference",
    resource: "ledger-categories",
    required: true,
    when: { field: "kind", in: ["pay", "receive"] },
  },
  {
    name: "counterparty",
    label: "Supplier / buyer / other party",
    type: "reference",
    resource: "counterparties",
    when: {
      field: "kind",
      in: ["acquire_stock", "pay", "receive", "transfer_stock"],
    },
  },
  {
    name: "stock_lot",
    label: "Specific lot (optional)",
    type: "reference",
    resource: "stock-lots",
    when: {
      field: "kind",
      in: ["consume_stock", "transfer_stock", "adjust_stock"],
    },
  },
  {
    name: "destination",
    label: "Destination space",
    type: "reference",
    resource: "assets",
    when: {
      field: "kind",
      in: ["transfer_stock", "produce_stock", "acquire_stock"],
    },
  },
  {
    name: "grade",
    label: "Produce grade",
    type: "reference",
    resource: "grades",
    when: { field: "kind", in: ["produce_stock"] },
  },
  {
    name: "expiry_date",
    label: "Lot expiry date",
    type: "date",
    when: { field: "kind", in: ["acquire_stock"] },
  },
  {
    name: "capitalize_to_asset",
    label: "Capitalise to asset (optional)",
    type: "reference",
    resource: "assets",
    when: { field: "kind", in: ["pay"] },
  },
  {
    name: "capital_terms",
    label: "Capital acquisition facts (if applicable)",
    type: "object",
    when: { field: "kind", in: ["pay"] },
    fields: [
      {
        name: "expected_life_hours",
        label: "Expected life in hours",
        type: "number",
        step: "any",
      },
      {
        name: "expected_life_years",
        label: "Expected life in years",
        type: "number",
        step: "any",
      },
      {
        name: "salvage_value",
        label: "Salvage value",
        type: "number",
        step: "any",
      },
    ],
  },
  {
    name: "new_asset_status",
    label: "New status",
    type: "select",
    required: true,
    options: ["active", "maintenance", "retired"].map((value) => ({
      value,
      label: value,
    })),
    when: { field: "kind", in: ["asset_status"] },
  },
  { name: "notes", label: "Notes / count reason", type: "textarea" },
];
function improveWorkFields(fields: import("@/types").Field[]) {
  for (const f of fields) {
    if (f.name === "lines") {
      f.label = "Resources";
      f.fields = resourceLines;
    } else if (f.name === "targets") f.label = "Where the work happens";
    else if (f.fields) improveWorkFields(f.fields);
  }
}
commands
  .filter((c) =>
    [
      "create_event",
      "record_observation",
      "adjust_stock",
      "amend_event",
    ].includes(c.key),
  )
  .forEach((c) => improveWorkFields(c.fields));
