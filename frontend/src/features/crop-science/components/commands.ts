import { localDateTime as commandClock } from "@/lib/format";
import type { CommandDefinition } from "@/types";
import { today } from "@/lib/format";
export const commands: CommandDefinition[] = [
  {
    key: "generate_calendar",
    label: "Build the crop calendar",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. The template event type must have usable default assets/lines. The seeded empty types are insufficient to plan real operations.",
    fields: [
      {
        name: "cycle_id",
        label: "Cycle id",
        type: "reference",
        required: true,
        resource: "crop-cycles",
      },
      {
        name: "template_id",
        label: "Template id",
        type: "reference",
        required: true,
        resource: "calendar-templates",
      },
    ],
    resource: "calendar-templates",
    build: (values) => ({ ...values }),
  },
  {
    key: "record_stage",
    label: "Record an observed stage",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "cycle_id",
        label: "Cycle id",
        type: "reference",
        required: true,
        resource: "crop-cycles",
      },
      {
        name: "stage_id",
        label: "Stage id",
        type: "reference",
        required: true,
        resource: "stages",
      },
      {
        name: "observed_on",
        label: "Observed on",
        type: "date",
        required: true,
        default: () => today(),
      },
      {
        name: "event_id",
        label: "Event id",
        type: "reference",
        required: true,
        resource: "events",
      },
    ],
    resource: "stage-records",
    build: (values) => ({ ...values }),
  },
  {
    key: "recompute_gdd",
    label: "Recalculate growing degree days",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires a cycle calendar and entered WeatherDaily rows.",
    fields: [
      {
        name: "cycle_id",
        label: "Cycle id",
        type: "reference",
        required: true,
        resource: "crop-cycles",
      },
    ],
    resource: "gdd",
    build: (values) => ({ ...values }),
  },
  {
    key: "decide_suggestion",
    label: "Review a suggestion",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "suggestion_id",
        label: "Suggestion id",
        type: "reference",
        required: true,
        resource: "suggestions",
      },
      {
        name: "accept",
        label: "Accept",
        type: "boolean",
        required: true,
        default: false,
      },
    ],
    resource: "suggestions",
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
  generate_calendar:
    "Generate planned work from a crop calendar template with configured resources.",
  record_stage:
    "Record the date a crop stage was observed, linked to a field observation.",
  recompute_gdd:
    "Recalculate growing degree days from the cycle\u2019s stage model and entered weather records.",
  decide_suggestion:
    "Accept or dismiss this field suggestion. Accepted suggestions need an appropriate operation plan.",
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
