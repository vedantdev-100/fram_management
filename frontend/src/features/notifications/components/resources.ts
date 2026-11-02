import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "notifications",
    title: "Notifications",
    model: "notifications.Notification",
    editable: false,
    versioned: false,
    columns: ["title", "kind", "status", "due_at"],
    fields: [
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "text",
      },
      {
        name: "title",
        label: "Title",
        required: false,
        type: "text",
      },
      {
        name: "body",
        label: "Body",
        required: false,
        type: "text",
      },
      {
        name: "related_type",
        label: "Related type",
        required: false,
        type: "text",
      },
      {
        name: "related_id",
        label: "Related id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "due_at",
        label: "Due at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "read_at",
        label: "Read at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "pending",
            label: "Pending",
          },
          {
            value: "sent",
            label: "Sent",
          },
          {
            value: "dismissed",
            label: "Dismissed",
          },
        ],
      },
      {
        name: "channel",
        label: "Channel",
        required: false,
        type: "select",
        options: [
          {
            value: "in_app",
            label: "In app",
          },
          {
            value: "email",
            label: "Email",
          },
        ],
      },
      {
        name: "dedupe_key",
        label: "Dedupe key",
        required: false,
        type: "text",
      },
      {
        name: "recipient",
        label: "Recipient",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
    ],
    relations: {},
  },
  {
    key: "reminder-rules",
    title: "Reminder rules",
    model: "notifications.ReminderRule",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "text",
      },
      {
        name: "lead_time",
        label: "Lead time",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "channel",
        label: "Channel",
        required: false,
        type: "select",
        options: [
          {
            value: "in_app",
            label: "In app",
          },
          {
            value: "email",
            label: "Email",
          },
        ],
      },
      {
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
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
