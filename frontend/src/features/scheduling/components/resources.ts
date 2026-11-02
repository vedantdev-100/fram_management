import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "availability-windows",
    title: "Availability windows",
    model: "scheduling.AvailabilityWindow",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "shift",
            label: "Shift",
          },
          {
            value: "downtime",
            label: "Downtime",
          },
          {
            value: "leave",
            label: "Leave",
          },
          {
            value: "maintenance",
            label: "Maintenance",
          },
        ],
      },
      {
        name: "window",
        label: "Window",
        required: true,
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
        name: "capacity_hours",
        label: "Capacity hours",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "recurrence_rule",
        label: "Recurrence rule",
        required: false,
        type: "text",
      },
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
    ],
    relations: {
      asset: "assets",
    },
  },
  {
    key: "restriction-windows",
    title: "Restriction windows",
    model: "scheduling.RestrictionWindow",
    editable: false,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
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
        name: "restriction_kind",
        label: "Restriction kind",
        required: false,
        type: "select",
        options: [
          {
            value: "reentry",
            label: "Reentry",
          },
          {
            value: "no_spray",
            label: "No spray",
          },
          {
            value: "no_harvest",
            label: "No harvest",
          },
        ],
      },
      {
        name: "source_type",
        label: "Source type",
        required: false,
        type: "text",
      },
      {
        name: "source_id",
        label: "Source id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
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
    ],
    relations: {
      block: "blocks",
      asset: "assets",
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
