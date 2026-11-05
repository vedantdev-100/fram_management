import { localDateTime as commandClock } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace";
import type { CommandDefinition } from "@/types";
export const commands: CommandDefinition[] = [
  {
    key: "remove_member",
    label: "Remove member from farm",
    description:
      "Revokes this member’s farm access. Their account and work history are preserved. The final active owner cannot be removed.",
    resource: "members",
    fields: [
      {
        name: "member_id",
        label: "Member",
        type: "reference",
        resource: "members",
        required: true,
      },
    ],
    build: (values) => ({ ...values }),
  },
  {
    key: "set_role_permissions",
    label: "Set role permissions",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "role_id",
        label: "Role id",
        type: "reference",
        required: true,
        resource: "roles",
      },
      {
        name: "codes",
        label: "Codes",
        type: "json",
        required: true,
        default: [],
        help: "Use exact permission codes.",
      },
    ],
    resource: "roles",
    build: (values) => ({ ...values }),
  },
  {
    key: "create_role",
    label: "Create a custom role",
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
        default: "Custom farm role",
      },
    ],
    resource: "roles",
    build: (values) => ({ ...values }),
  },
  {
    key: "update_farm",
    label: "Update farm preferences",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "farm",
        label: "Farm",
        type: "object",
        required: true,
        fields: [
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            default: "",
          },
          {
            name: "country",
            label: "Country",
            type: "text",
            required: true,
            default: "IN",
          },
          {
            name: "region",
            label: "Region",
            type: "text",
            required: true,
            default: "",
          },
          {
            name: "timezone",
            label: "Timezone",
            type: "text",
            required: true,
            default: "Asia/Kolkata",
          },
          {
            name: "require_supervisor_confirmation",
            label: "Require supervisor confirmation",
            type: "boolean",
            required: true,
            default: true,
          },
        ],
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
    build: (values) => ({ ...values }),
  },
  {
    key: "duplicate_configuration",
    label: "Copy a shared configuration",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "resource",
        label: "Resource",
        type: "text",
        required: true,
        default: "units",
      },
      {
        name: "id",
        label: "Id",
        type: "text",
        required: true,
      },
      {
        name: "changes",
        label: "Changes",
        type: "object",
        required: true,
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
            default: "Farm kilogram",
          },
        ],
      },
    ],
    build: (values) => ({ ...values }),
  },
  {
    key: "invite",
    label: "Invite a team member",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "email",
        label: "Email",
        type: "text",
        required: true,
      },
      {
        name: "role_id",
        label: "Role id",
        type: "reference",
        required: true,
        resource: "roles",
      },
    ],
    resource: "invitations",
    build: (values) => ({ ...values }),
  },
  {
    key: "change_member",
    label: "Change a member\u2019s access",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Use a NON-OWNER target member_id. The last active owner cannot be demoted. Do not run this blindly on the owner membership.",
    fields: [
      {
        name: "member_id",
        label: "Member id",
        type: "reference",
        required: true,
        resource: "members",
      },
      {
        name: "role_id",
        label: "Role id",
        type: "reference",
        required: true,
        resource: "roles",
      },
      {
        name: "status",
        label: "Status",
        type: "select",
        required: true,
        options: [
          {
            value: "active",
            label: "Active",
          },
          {
            value: "suspended",
            label: "Suspended",
          },
          {
            value: "invited",
            label: "Invited",
          },
        ],
        default: "active",
      },
    ],
    resource: "members",
    build: (values) => ({ ...values }),
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

const copy = commands.find((c) => c.key === "duplicate_configuration");
if (copy) {
  copy.fields = [
    {
      name: "resource",
      label: "Configuration type",
      type: "select",
      required: true,
      default: "units",
      options: [
        { value: "units", label: "Units" },
        { value: "crops", label: "Crops" },
        { value: "products", label: "Products" },
      ],
    },
    {
      name: "id",
      label: "Source record",
      type: "reference",
      resourceField: "resource",
      required: true,
    },
    {
      name: "changes",
      label: "Your farm’s copy",
      type: "object",
      fields: [
        { name: "code", label: "Unique code", type: "text" },
        { name: "name", label: "Name", type: "text", required: true },
      ],
    },
  ];
}

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

const farmSettings = commands.find((c) => c.key === "update_farm");
if (farmSettings)
  farmSettings.initial = () => {
    const farm = useWorkspace.getState().farm;
    return {
      version: farm?.version || 1,
      farm: {
        name: farm?.name,
        country: farm?.country,
        region: farm?.region,
        timezone: farm?.timezone,
        require_supervisor_confirmation:
          farm?.require_supervisor_confirmation ?? true,
      },
    };
  };

const descriptions: Record<string, string> = {
  invite:
    "Create an invitation for a person and role. The invitation token can then be shared through your chosen channel.",
  change_member:
    "Change a member\u2019s role or suspend access. The final active owner cannot be removed.",
  create_role:
    "Create a farm-specific role. Add only the permissions appropriate for this person\u2019s work.",
  set_role_permissions:
    "Choose the exact permissions granted to a custom role. Owner permissions remain protected.",
  update_farm:
    "Update the farm\u2019s identity and preferences. Currency cannot change after financial transactions exist.",
  duplicate_configuration:
    "Copy a shared unit, crop or product into your farm\u2019s configuration.",
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
