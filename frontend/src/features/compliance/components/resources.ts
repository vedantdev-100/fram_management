import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "treatments",
    title: "Treatments",
    model: "compliance.TreatmentRecord",
    editable: false,
    versioned: false,
    columns: ["product", "crop_cycle", "applied_at", "waiting_period_ends_on"],
    fields: [
      {
        name: "qty_applied",
        label: "Qty applied",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "area_covered_m2",
        label: "Area covered m2",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "dose_per_area",
        label: "Dose per area",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "applied_at",
        label: "Applied at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "weather_note",
        label: "Weather note",
        required: false,
        type: "text",
      },
      {
        name: "mode_of_action_group",
        label: "Mode of action group",
        required: false,
        type: "text",
      },
      {
        name: "waiting_period_ends_on",
        label: "Waiting period ends on",
        required: false,
        type: "date",
      },
      {
        name: "reentry_ends_at",
        label: "Reentry ends at",
        required: false,
        type: "datetime-local",
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
        name: "product",
        label: "Product",
        required: false,
        type: "reference",
        resource: "products",
      },
      {
        name: "stock_lot",
        label: "Stock lot",
        required: false,
        type: "reference",
        resource: "stock-lots",
      },
      {
        name: "qty_unit",
        label: "Qty unit",
        required: false,
        type: "reference",
        resource: "units",
      },
      {
        name: "operator",
        label: "Operator",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "treatments",
      },
    ],
    relations: {
      event: "events",
      crop_cycle: "crop-cycles",
      block: "blocks",
      product: "products",
      stock_lot: "stock-lots",
      qty_unit: "units",
      operator: "assets",
      reversal_of: "treatments",
    },
  },
  {
    key: "checks",
    title: "Checks",
    model: "compliance.ComplianceCheck",
    editable: false,
    versioned: false,
    columns: ["event", "check_code", "result", "message"],
    fields: [
      {
        name: "check_code",
        label: "Check code",
        required: false,
        type: "text",
      },
      {
        name: "result",
        label: "Result",
        required: false,
        type: "select",
        options: [
          {
            value: "pass",
            label: "Pass",
          },
          {
            value: "warn",
            label: "Warn",
          },
          {
            value: "block",
            label: "Block",
          },
        ],
      },
      {
        name: "message",
        label: "Message",
        required: false,
        type: "textarea",
      },
      {
        name: "evaluated_at",
        label: "Evaluated at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
    ],
    relations: {
      event: "events",
      sub_event: "sub-events",
    },
  },
  {
    key: "overrides",
    title: "Overrides",
    model: "compliance.ComplianceOverride",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
      },
      {
        name: "compliance_check",
        label: "Compliance check",
        required: false,
        type: "reference",
        resource: "checks",
      },
      {
        name: "overridden_by",
        label: "Overridden by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
    ],
    relations: {
      compliance_check: "checks",
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
