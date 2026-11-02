import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "scenarios",
    title: "Scenarios",
    model: "workbench.Scenario",
    editable: true,
    versioned: false,
    columns: ["name", "season", "status", "adopted_at"],
    fields: [
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
      {
        name: "adopted_at",
        label: "Adopted at",
        required: false,
        type: "datetime-local",
        nullable: true,
      },
      {
        name: "season",
        label: "Season",
        required: true,
        type: "reference",
        resource: "seasons",
      },
      {
        name: "based_on",
        label: "Based on",
        required: false,
        type: "reference",
        resource: "scenarios",
        nullable: true,
      },
    ],
    relations: {
      season: "seasons",
      based_on: "scenarios",
    },
  },
  {
    key: "assumptions",
    title: "Assumptions",
    model: "workbench.ScenarioAssumption",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "key",
        label: "Key",
        required: false,
        type: "select",
        options: [
          {
            value: "price_multiplier",
            label: "Price multiplier",
          },
          {
            value: "yield_multiplier",
            label: "Yield multiplier",
          },
          {
            value: "wage_rate",
            label: "Wage rate",
          },
          {
            value: "fuel_price",
            label: "Fuel price",
          },
          {
            value: "rent",
            label: "Rent",
          },
        ],
      },
      {
        name: "value",
        label: "Value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "scenario",
        label: "Scenario",
        required: true,
        type: "reference",
        resource: "scenarios",
      },
      {
        name: "crop",
        label: "Crop",
        required: false,
        type: "reference",
        resource: "crops",
        nullable: true,
      },
    ],
    relations: {
      scenario: "scenarios",
      crop: "crops",
    },
  },
  {
    key: "scenario-cycles",
    title: "Scenario cycles",
    model: "workbench.ScenarioCropCycle",
    editable: true,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "scenario",
        label: "Scenario",
        required: true,
        type: "reference",
        resource: "scenarios",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: true,
        type: "reference",
        resource: "crop-cycles",
      },
    ],
    relations: {
      scenario: "scenarios",
      crop_cycle: "crop-cycles",
    },
  },
  {
    key: "metrics",
    title: "Metrics",
    model: "workbench.ScenarioMetric",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "metric_code",
        label: "Metric code",
        required: false,
        type: "text",
      },
      {
        name: "value",
        label: "Value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "computed_at",
        label: "Computed at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "assumptions_hash",
        label: "Assumptions hash",
        required: false,
        type: "text",
      },
      {
        name: "scenario",
        label: "Scenario",
        required: false,
        type: "reference",
        resource: "scenarios",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
    ],
    relations: {
      scenario: "scenarios",
      crop_cycle: "crop-cycles",
    },
  },
  {
    key: "decisions",
    title: "Decisions",
    model: "workbench.DecisionJournal",
    editable: true,
    versioned: false,
    columns: ["event", "crop_cycle", "created_at"],
    fields: [
      {
        name: "decided_on",
        label: "Decided on",
        required: true,
        type: "date",
      },
      {
        name: "title",
        label: "Title",
        required: false,
        type: "text",
      },
      {
        name: "decision_text",
        label: "Decision text",
        required: false,
        type: "textarea",
      },
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
      },
      {
        name: "assumptions",
        label: "Assumptions",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "expected",
        label: "Expected",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "review_on",
        label: "Review on",
        required: false,
        type: "date",
        nullable: true,
      },
      {
        name: "outcome_text",
        label: "Outcome text",
        required: false,
        type: "textarea",
      },
      {
        name: "outcome_logged_at",
        label: "Outcome logged at",
        required: false,
        type: "datetime-local",
        nullable: true,
      },
      {
        name: "decided_by",
        label: "Decided by",
        required: true,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "scenario",
        label: "Scenario",
        required: false,
        type: "reference",
        resource: "scenarios",
        nullable: true,
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
        nullable: true,
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
        nullable: true,
      },
    ],
    relations: {
      scenario: "scenarios",
      crop_cycle: "crop-cycles",
      event: "events",
    },
  },
  {
    key: "investment-analyses",
    title: "Investment analyses",
    model: "workbench.InvestmentAnalysis",
    editable: true,
    versioned: false,
    columns: ["name", "created_at"],
    fields: [
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "option_kind",
        label: "Option kind",
        required: false,
        type: "select",
        options: [
          {
            value: "buy",
            label: "Buy",
          },
          {
            value: "lease",
            label: "Lease",
          },
          {
            value: "hire",
            label: "Hire",
          },
          {
            value: "skip",
            label: "Skip",
          },
        ],
      },
      {
        name: "asset_class",
        label: "Asset class",
        required: false,
        type: "text",
      },
      {
        name: "inputs",
        label: "Inputs",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "decision",
        label: "Decision",
        required: false,
        type: "reference",
        resource: "decisions",
        nullable: true,
      },
    ],
    relations: {
      decision: "decisions",
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

const investment = resources.find((r) => r.key === "investment-analyses");
const inputs = investment?.fields.find((f) => f.name === "inputs");
if (inputs)
  Object.assign(inputs, {
    type: "object",
    advanced: false,
    label: "Investment assumptions",
    fields: [
      {
        name: "price",
        label: "Acquisition price",
        type: "number",
        step: "any",
        required: true,
      },
      {
        name: "salvage",
        label: "Expected salvage value",
        type: "number",
        step: "any",
      },
      {
        name: "life_years",
        label: "Useful life in years",
        type: "number",
        step: "any",
        required: true,
      },
      {
        name: "hours_per_year",
        label: "Expected hours per year",
        type: "number",
        step: "any",
        required: true,
      },
      {
        name: "interest_rate",
        label: "Annual interest rate (%)",
        type: "number",
        step: "any",
      },
      {
        name: "hire_rate",
        label: "Alternative hire rate per hour",
        type: "number",
        step: "any",
      },
      {
        name: "annual_rent",
        label: "Alternative annual rent",
        type: "number",
        step: "any",
      },
    ],
  });
