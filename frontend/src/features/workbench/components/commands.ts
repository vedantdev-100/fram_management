import { localDateTime as commandClock } from "@/lib/format";
import type { CommandDefinition } from "@/types";
export const commands: CommandDefinition[] = [
  {
    key: "archive_scenario",
    label: "Archive a draft scenario",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "scenario_id",
        label: "Scenario id",
        type: "reference",
        required: true,
        resource: "scenarios",
      },
    ],
    resource: "scenarios",
    build: (values) => ({ ...values }),
  },
  {
    key: "compute_metrics",
    label: "Compare scenario figures",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "scenario_id",
        label: "Scenario id",
        type: "reference",
        required: true,
        resource: "scenarios",
      },
    ],
    resource: "scenarios",
    build: (values) => ({ ...values }),
  },
  {
    key: "adopt_scenario",
    label: "Adopt this scenario",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Adopt only after preparing draft crop cycles and draft events; this changes the scenario into a live plan.",
    fields: [
      {
        name: "scenario_id",
        label: "Scenario id",
        type: "reference",
        required: true,
        resource: "scenarios",
      },
    ],
    resource: "scenarios",
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
  compute_metrics:
    "Recalculate the figures currently supported by the scenario comparison.",
  adopt_scenario:
    "Turn this scenario\u2019s draft cycles and operations into a live plan, after checking availability.",
  archive_scenario:
    "Archive a draft or compared scenario you no longer want to pursue.",
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
