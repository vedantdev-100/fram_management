import { localDateTime as commandClock } from "@/lib/format";
import { uuid } from "@/lib/uuid";
import type { CommandDefinition } from "@/types";
import { localDateTime } from "@/lib/format";
export const commands: CommandDefinition[] = [
  {
    key: "ledger_transfer",
    label: "Transfer between accounts",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "source_id",
        label: "Source id",
        type: "reference",
        required: true,
        resource: "accounts",
      },
      {
        name: "destination_id",
        label: "Destination id",
        type: "reference",
        required: true,
        resource: "accounts",
      },
      {
        name: "amount",
        label: "Amount",
        type: "number",
        required: true,
        step: "any",
        default: "1000",
      },
      {
        name: "at",
        label: "At",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
    ],
    resource: "accounts",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
  {
    key: "record_payment",
    label: "Record a payment",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "event_type",
        label: "Event type",
        type: "reference",
        required: true,
        resource: "types",
      },
      {
        name: "planned_start",
        label: "Planned start",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "planned_end",
        label: "Planned end",
        type: "datetime-local",
        required: true,
        default: () => localDateTime(new Date().toISOString()),
      },
      {
        name: "lines",
        label: "Lines",
        type: "array",
        required: true,
        fields: [
          {
            name: "kind",
            label: "Kind",
            type: "select",
            required: true,
            options: [
              {
                value: "use_machine",
                label: "Use machine",
              },
              {
                value: "use_labour",
                label: "Use labour",
              },
              {
                value: "consume_stock",
                label: "Consume stock",
              },
              {
                value: "occupy_space",
                label: "Occupy space",
              },
              {
                value: "produce_stock",
                label: "Produce stock",
              },
              {
                value: "transfer_stock",
                label: "Transfer stock",
              },
              {
                value: "adjust_stock",
                label: "Adjust stock",
              },
              {
                value: "living_gain",
                label: "Living gain",
              },
              {
                value: "living_loss",
                label: "Living loss",
              },
              {
                value: "pay",
                label: "Pay",
              },
              {
                value: "receive",
                label: "Receive",
              },
              {
                value: "acquire_stock",
                label: "Acquire stock",
              },
              {
                value: "asset_status",
                label: "Asset status",
              },
            ],
            default: "pay",
          },
          {
            name: "asset",
            label: "Asset",
            type: "reference",
            required: true,
            resource: "assets",
          },
          {
            name: "planned_qty",
            label: "Planned qty",
            type: "number",
            required: true,
            step: "any",
            default: "1",
          },
          {
            name: "qty_unit",
            label: "Qty unit",
            type: "reference",
            required: true,
            resource: "units",
          },
          {
            name: "amount",
            label: "Amount",
            type: "number",
            required: true,
            step: "any",
          },
          {
            name: "account_id",
            label: "Account id",
            type: "reference",
            required: true,
            resource: "accounts",
          },
          {
            name: "ledger_category_id",
            label: "Ledger category id",
            type: "reference",
            required: true,
            resource: "ledger-categories",
          },
        ],
        default: [{}],
      },
    ],
    resource: "entries",
    build: (values) => ({
      ...values,
      client_uuid: values.client_uuid || uuid(),
    }),
  },
  {
    key: "generate_loan_schedule",
    label: "Calculate loan repayments",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "loan_id",
        label: "Loan id",
        type: "reference",
        required: true,
        resource: "loans",
      },
    ],
    resource: "loans",
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
  ledger_transfer:
    "Record both sides of an internal movement between two farm accounts.",
  record_payment:
    "Record an actual payment or receipt linked to a farm operation.",
  generate_loan_schedule:
    "Calculate repayment dates, principal and interest from the loan\u2019s recorded terms.",
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

const pay = commands.find((c) => c.key === "record_payment");
if (pay) {
  const lines = pay.fields.find((f) => f.name === "lines");
  const kind = lines?.fields?.find((f) => f.name === "kind");
  if (kind) {
    kind.label = "Direction";
    kind.options = [
      { value: "pay", label: "Payment" },
      { value: "receive", label: "Receipt" },
    ];
  }
}
