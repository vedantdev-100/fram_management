import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "stage-models",
    title: "Stage models",
    model: "cropscience.CropStageModel",
    editable: true,
    versioned: false,
    columns: ["name", "created_at"],
    fields: [
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "basis",
        label: "Basis",
        required: false,
        type: "select",
        options: [
          {
            value: "days",
            label: "Days",
          },
          {
            value: "gdd",
            label: "Gdd",
          },
        ],
      },
      {
        name: "base_temp_c",
        label: "Base temp c",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "upper_temp_c",
        label: "Upper temp c",
        required: false,
        type: "number",
        step: "any",
        nullable: true,
      },
      {
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
      {
        name: "variety",
        label: "Variety",
        required: false,
        type: "reference",
        resource: "varieties",
        nullable: true,
      },
    ],
    relations: {
      crop: "crops",
      variety: "varieties",
    },
  },
  {
    key: "stages",
    title: "Stages",
    model: "cropscience.CropStage",
    editable: true,
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
        name: "order_no",
        label: "Order no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "start_threshold",
        label: "Start threshold",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "end_threshold",
        label: "End threshold",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "is_critical",
        label: "Is critical",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "stage_model",
        label: "Stage model",
        required: true,
        type: "reference",
        resource: "stage-models",
      },
    ],
    relations: {
      stage_model: "stage-models",
    },
  },
  {
    key: "calendar-templates",
    title: "Calendar templates",
    model: "cropscience.CalendarTemplate",
    editable: true,
    versioned: false,
    columns: ["name", "created_at"],
    fields: [
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "version_no",
        label: "Version no",
        required: false,
        type: "number",
        step: "1",
        default: 1,
      },
      {
        name: "region_note",
        label: "Region note",
        required: false,
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
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
      {
        name: "variety",
        label: "Variety",
        required: false,
        type: "reference",
        resource: "varieties",
        nullable: true,
      },
      {
        name: "stage_model",
        label: "Stage model",
        required: true,
        type: "reference",
        resource: "stage-models",
      },
    ],
    relations: {
      crop: "crops",
      variety: "varieties",
      stage_model: "stage-models",
    },
  },
  {
    key: "calendar-template-items",
    title: "Calendar template items",
    model: "cropscience.CalendarTemplateItem",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "label",
        label: "Label",
        required: false,
        type: "text",
      },
      {
        name: "anchor",
        label: "Anchor",
        required: false,
        type: "select",
        options: [
          {
            value: "sowing",
            label: "Sowing",
          },
          {
            value: "stage_start",
            label: "Stage start",
          },
          {
            value: "stage_end",
            label: "Stage end",
          },
          {
            value: "previous_item",
            label: "Previous item",
          },
        ],
      },
      {
        name: "offset_days_min",
        label: "Offset days min",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "offset_days_max",
        label: "Offset days max",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "repeat_every_days",
        label: "Repeat every days",
        required: false,
        type: "number",
        step: "1",
        nullable: true,
      },
      {
        name: "repeat_max",
        label: "Repeat max",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "is_optional",
        label: "Is optional",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
      {
        name: "template",
        label: "Template",
        required: true,
        type: "reference",
        resource: "calendar-templates",
      },
      {
        name: "event_type",
        label: "Event type",
        required: true,
        type: "reference",
        resource: "types",
      },
      {
        name: "stage",
        label: "Stage",
        required: false,
        type: "reference",
        resource: "stages",
        nullable: true,
      },
    ],
    relations: {
      template: "calendar-templates",
      event_type: "types",
      stage: "stages",
    },
  },
  {
    key: "cycle-calendars",
    title: "Cycle calendars",
    model: "cropscience.CropCycleCalendar",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "template_version_no",
        label: "Template version no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "anchor_date",
        label: "Anchor date",
        required: false,
        type: "date",
      },
      {
        name: "generated_at",
        label: "Generated at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "template",
        label: "Template",
        required: false,
        type: "reference",
        resource: "calendar-templates",
      },
    ],
    relations: {
      crop_cycle: "crop-cycles",
      template: "calendar-templates",
    },
  },
  {
    key: "stage-records",
    title: "Stage records",
    model: "cropscience.CropStageRecord",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "observed_on",
        label: "Observed on",
        required: false,
        type: "date",
      },
      {
        name: "basis",
        label: "Basis",
        required: false,
        type: "select",
        options: [
          {
            value: "estimated",
            label: "Estimated",
          },
          {
            value: "observed",
            label: "Observed",
          },
        ],
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "stage",
        label: "Stage",
        required: false,
        type: "reference",
        resource: "stages",
      },
      {
        name: "source_event",
        label: "Source event",
        required: false,
        type: "reference",
        resource: "events",
      },
    ],
    relations: {
      crop_cycle: "crop-cycles",
      stage: "stages",
      source_event: "events",
    },
  },
  {
    key: "weather",
    title: "Weather",
    model: "cropscience.WeatherDaily",
    editable: true,
    versioned: false,
    columns: ["date", "block", "tmin_c", "tmax_c", "rain_mm"],
    fields: [
      {
        name: "date",
        label: "Date",
        required: true,
        type: "date",
      },
      {
        name: "tmin_c",
        label: "Tmin c",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "tmax_c",
        label: "Tmax c",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "rain_mm",
        label: "Rain mm",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "source",
        label: "Source",
        required: false,
        type: "select",
        options: [
          {
            value: "manual",
            label: "Manual",
          },
          {
            value: "service",
            label: "Service",
          },
        ],
      },
      {
        name: "is_forecast",
        label: "Is forecast",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
        nullable: true,
      },
    ],
    relations: {
      block: "blocks",
    },
  },
  {
    key: "gdd",
    title: "Gdd",
    model: "cropscience.GddDaily",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "date",
        label: "Date",
        required: false,
        type: "date",
      },
      {
        name: "gdd",
        label: "Gdd",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "cumulative_gdd",
        label: "Cumulative gdd",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
    ],
    relations: {
      crop_cycle: "crop-cycles",
    },
  },
  {
    key: "thresholds",
    title: "Thresholds",
    model: "cropscience.ThresholdRule",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "observation_kind",
        label: "Observation kind",
        required: false,
        type: "text",
      },
      {
        name: "metric_name",
        label: "Metric name",
        required: false,
        type: "text",
      },
      {
        name: "operator",
        label: "Operator",
        required: false,
        type: "select",
        options: [
          {
            value: "gt",
            label: "Gt",
          },
          {
            value: "gte",
            label: "Gte",
          },
          {
            value: "lt",
            label: "Lt",
          },
          {
            value: "lte",
            label: "Lte",
          },
          {
            value: "eq",
            label: "Eq",
          },
        ],
      },
      {
        name: "threshold_value",
        label: "Threshold value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "severity_min",
        label: "Severity min",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "message",
        label: "Message",
        required: false,
        type: "textarea",
      },
      {
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
      {
        name: "recommended_event_type",
        label: "Recommended event type",
        required: true,
        type: "reference",
        resource: "types",
      },
    ],
    relations: {
      crop: "crops",
      recommended_event_type: "types",
    },
  },
  {
    key: "suggestions",
    title: "Suggestions",
    model: "cropscience.Suggestion",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "status", "created_at"],
    fields: [
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "open",
            label: "Open",
          },
          {
            value: "accepted",
            label: "Accepted",
          },
          {
            value: "dismissed",
            label: "Dismissed",
          },
        ],
      },
      {
        name: "decided_at",
        label: "Decided at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "source_event",
        label: "Source event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "rule",
        label: "Rule",
        required: false,
        type: "reference",
        resource: "thresholds",
      },
      {
        name: "recommended_event_type",
        label: "Recommended event type",
        required: false,
        type: "reference",
        resource: "types",
      },
      {
        name: "decided_by",
        label: "Decided by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "resulting_event",
        label: "Resulting event",
        required: false,
        type: "reference",
        resource: "events",
      },
    ],
    relations: {
      crop_cycle: "crop-cycles",
      source_event: "events",
      rule: "thresholds",
      recommended_event_type: "types",
      resulting_event: "events",
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

const priority = [
  "calendar-templates",
  "stage-models",
  "stage-records",
  "suggestions",
  "weather",
];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
