import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "audit-log",
    title: "Audit log",
    model: "audit.AuditLog",
    editable: false,
    versioned: false,
    columns: ["command_name", "target_type", "result", "created_at"],
    fields: [
      {
        name: "command_name",
        label: "Command name",
        required: false,
        type: "text",
      },
      {
        name: "target_type",
        label: "Target type",
        required: false,
        type: "text",
      },
      {
        name: "target_id",
        label: "Target id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "payload",
        label: "Payload",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "result",
        label: "Result",
        required: false,
        type: "select",
        options: [
          {
            value: "success",
            label: "Success",
          },
          {
            value: "rejected",
            label: "Rejected",
          },
        ],
      },
      {
        name: "ip_address",
        label: "Ip address",
        required: false,
        type: "text",
      },
      {
        name: "user_agent",
        label: "User agent",
        required: false,
        type: "text",
      },
      {
        name: "user",
        label: "User",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
    ],
    relations: {},
  },
  {
    key: "configuration-history",
    title: "Configuration history",
    model: "audit.ConfigurationHistory",
    editable: false,
    versioned: false,
    columns: ["target_type", "created_at"],
    fields: [
      {
        name: "target_type",
        label: "Target type",
        required: false,
        type: "text",
      },
      {
        name: "target_id",
        label: "Target id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "before",
        label: "Before",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "after",
        label: "After",
        required: false,
        type: "json",
        advanced: true,
      },
    ],
    relations: {},
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
