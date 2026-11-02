import { localDateTime as commandClock } from "@/lib/format";
import type { CommandDefinition } from "@/types";
import { today } from "@/lib/format";
export const commands: CommandDefinition[] = [
  {
    key: "change_depreciation_policy",
    label: "Review depreciation method",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. preview=true is the default example. An acquired capital profile is required. An apply example follows separately.",
    fields: [
      {
        name: "asset_id",
        label: "Asset id",
        type: "reference",
        required: true,
        resource: "assets",
      },
      {
        name: "policy_id",
        label: "Policy id",
        type: "reference",
        required: true,
        resource: "depreciation-policies",
      },
      {
        name: "effective_date",
        label: "Effective date",
        type: "date",
        required: true,
        default: () => today(),
      },
      {
        name: "preview",
        label: "Preview",
        type: "boolean",
        required: true,
        default: true,
      },
    ],
    resource: "depreciation-assignments",
    build: (values) => ({ ...values }),
  },
  {
    key: "run_reconciliation",
    label: "Reconcile a period",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "start",
        label: "Start",
        type: "date",
        required: true,
        default: () => today(),
      },
      {
        name: "end",
        label: "End",
        type: "date",
        required: true,
        default: () => today(),
      },
    ],
    resource: "reconciliation-runs",
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
  change_depreciation_policy:
    "Preview a prospective depreciation method change before applying it. A capital profile is required.",
  run_reconciliation:
    "Compare recorded asset payments, register values and recognised costs for the selected period.",
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
