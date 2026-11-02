import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "roles",
    title: "Roles",
    model: "identity.Role",
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
        name: "description",
        label: "Description",
        required: false,
        type: "textarea",
      },
    ],
    relations: {},
  },
  {
    key: "members",
    title: "Members",
    model: "identity.Membership",
    editable: false,
    versioned: false,
    columns: ["user", "role", "status", "joined_at"],
    fields: [
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "invited",
            label: "Invited",
          },
          {
            value: "active",
            label: "Active",
          },
          {
            value: "suspended",
            label: "Suspended",
          },
        ],
      },
      {
        name: "joined_at",
        label: "Joined at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "user",
        label: "User",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "role",
        label: "Role",
        required: false,
        type: "reference",
        resource: "roles",
      },
    ],
    relations: {
      role: "roles",
    },
  },
  {
    key: "invitations",
    title: "Invitations",
    model: "identity.Invitation",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "email",
        label: "Email",
        required: false,
        type: "text",
      },
      {
        name: "expires_at",
        label: "Expires at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "accepted_at",
        label: "Accepted at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "role",
        label: "Role",
        required: false,
        type: "reference",
        resource: "roles",
      },
      {
        name: "invited_by",
        label: "Invited by",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
    ],
    relations: {
      role: "roles",
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

const priority = ["members", "roles", "invitations"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
