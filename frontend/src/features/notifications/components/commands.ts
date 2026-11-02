import { localDateTime as commandClock } from "@/lib/format";
import type { CommandDefinition } from "@/types";
export const commands: CommandDefinition[] = [
  {
    key: "mark_notification_read",
    label: "Mark an update as read",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "notification_id",
        label: "Notification id",
        type: "reference",
        required: true,
        resource: "notifications",
      },
    ],
    resource: "notifications",
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
  mark_notification_read: "Mark an update addressed to you as read.",
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
