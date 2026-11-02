import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "cost-rules",
    title: "Cost rules",
    model: "costing.CostRule",
    editable: true,
    versioned: true,
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
        name: "rule_type",
        label: "Rule type",
        required: false,
        type: "select",
        options: [
          {
            value: "hourly_rate",
            label: "Hourly rate",
          },
          {
            value: "daily_rent",
            label: "Daily rent",
          },
          {
            value: "wage_per_hour",
            label: "Wage per hour",
          },
          {
            value: "imputed_labour",
            label: "Imputed labour",
          },
          {
            value: "stock_average",
            label: "Stock average",
          },
          {
            value: "flow_estimate",
            label: "Flow estimate",
          },
          {
            value: "fixed_per_event",
            label: "Fixed per event",
          },
        ],
      },
      {
        name: "params",
        label: "Params",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "version_no",
        label: "Version no",
        required: false,
        type: "number",
        step: "1",
        default: 1,
      },
      {
        name: "effective_from",
        label: "Effective from",
        required: true,
        type: "date",
      },
      {
        name: "effective_to",
        label: "Effective to",
        required: false,
        type: "date",
        nullable: true,
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
  {
    key: "cost-rule-assignments",
    title: "Cost rule assignments",
    model: "costing.AssetCostRuleAssignment",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "role",
        label: "Role",
        required: false,
        type: "select",
        options: [
          {
            value: "use",
            label: "Use",
          },
          {
            value: "holding",
            label: "Holding",
          },
        ],
      },
      {
        name: "effective_from",
        label: "Effective from",
        required: true,
        type: "date",
      },
      {
        name: "effective_to",
        label: "Effective to",
        required: false,
        type: "date",
        nullable: true,
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "cost_rule",
        label: "Cost rule",
        required: true,
        type: "reference",
        resource: "cost-rules",
      },
    ],
    relations: {
      asset: "assets",
      cost_rule: "cost-rules",
    },
  },
  {
    key: "cost-records",
    title: "Cost records",
    model: "costing.CostRecord",
    editable: false,
    versioned: false,
    columns: ["event", "cost_nature", "basis_qty", "amount", "occurred_on"],
    fields: [
      {
        name: "cost_nature",
        label: "Cost nature",
        required: false,
        type: "select",
        options: [
          {
            value: "consumption",
            label: "Consumption",
          },
          {
            value: "machine_use",
            label: "Machine use",
          },
          {
            value: "depreciation",
            label: "Depreciation",
          },
          {
            value: "labour",
            label: "Labour",
          },
          {
            value: "flow",
            label: "Flow",
          },
          {
            value: "holding",
            label: "Holding",
          },
          {
            value: "loss",
            label: "Loss",
          },
        ],
      },
      {
        name: "basis_qty",
        label: "Basis qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "rate_used",
        label: "Rate used",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "amount",
        label: "Amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "rule_version_no",
        label: "Rule version no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "occurred_on",
        label: "Occurred on",
        required: false,
        type: "date",
      },
      {
        name: "is_imputed",
        label: "Is imputed",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "sub_event",
        label: "Sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
      {
        name: "basis_unit",
        label: "Basis unit",
        required: false,
        type: "reference",
        resource: "units",
      },
      {
        name: "rule",
        label: "Rule",
        required: false,
        type: "reference",
        resource: "cost-rules",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "cost-records",
      },
    ],
    relations: {
      sub_event: "sub-events",
      event: "events",
      basis_unit: "units",
      rule: "cost-rules",
      reversal_of: "cost-records",
    },
  },
  {
    key: "allocations",
    title: "Allocations",
    model: "costing.CostAllocation",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "bucket", "amount"],
    fields: [
      {
        name: "bucket",
        label: "Bucket",
        required: false,
        type: "select",
        options: [
          {
            value: "operation",
            label: "Operation",
          },
          {
            value: "holding",
            label: "Holding",
          },
          {
            value: "idle",
            label: "Idle",
          },
          {
            value: "overhead",
            label: "Overhead",
          },
        ],
      },
      {
        name: "share_fraction",
        label: "Share fraction",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "amount",
        label: "Amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "cost_record",
        label: "Cost record",
        required: false,
        type: "reference",
        resource: "cost-records",
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "purpose_tag",
        label: "Purpose tag",
        required: false,
        type: "reference",
        resource: "purpose-tags",
      },
      {
        name: "event_target",
        label: "Event target",
        required: false,
        type: "reference",
        resource: "targets",
      },
    ],
    relations: {
      cost_record: "cost-records",
      crop_cycle: "crop-cycles",
      purpose_tag: "purpose-tags",
      event_target: "targets",
    },
  },
  {
    key: "holding-runs",
    title: "Holding runs",
    model: "costing.HoldingAccrualRun",
    editable: false,
    versioned: false,
    columns: ["status", "created_at"],
    fields: [
      {
        name: "accrual_date",
        label: "Accrual date",
        required: false,
        type: "date",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "running",
            label: "Running",
          },
          {
            value: "done",
            label: "Done",
          },
        ],
      },
      {
        name: "started_at",
        label: "Started at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "finished_at",
        label: "Finished at",
        required: false,
        type: "datetime-local",
      },
      {
        name: "rows_created",
        label: "Rows created",
        required: false,
        type: "number",
        step: "1",
      },
    ],
    relations: {},
  },
  {
    key: "valuations",
    title: "Valuations",
    model: "costing.AssetValuation",
    editable: false,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "as_of_date",
        label: "As of date",
        required: false,
        type: "date",
      },
      {
        name: "value",
        label: "Value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "basis",
        label: "Basis",
        required: false,
        type: "text",
      },
      {
        name: "components",
        label: "Components",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
    ],
    relations: {
      asset: "assets",
    },
  },
  {
    key: "event-summaries",
    title: "Event summaries",
    model: "costing.EventCostSummary",
    editable: false,
    versioned: false,
    columns: ["event", "created_at"],
    fields: [
      {
        name: "planned_total",
        label: "Planned total",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "actual_total",
        label: "Actual total",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "cost_per_area",
        label: "Cost per area",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "variance",
        label: "Variance",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "breakdown",
        label: "Breakdown",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "event",
        label: "Event",
        required: false,
        type: "reference",
        resource: "events",
      },
    ],
    relations: {
      event: "events",
    },
  },
  {
    key: "cycle-summaries",
    title: "Cycle summaries",
    model: "costing.CropCycleCostSummary",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "as_of_date",
        label: "As of date",
        required: false,
        type: "date",
      },
      {
        name: "operation_cost",
        label: "Operation cost",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "holding_cost",
        label: "Holding cost",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "revenue",
        label: "Revenue",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "margin",
        label: "Margin",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "cost_per_area",
        label: "Cost per area",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "margin_per_area",
        label: "Margin per area",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "labour_hours",
        label: "Labour hours",
        required: false,
        type: "number",
        step: "any",
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
      crop_cycle: "crop-cycles",
    },
  },
  {
    key: "reconciliation-runs",
    title: "Reconciliation runs",
    model: "costing.ReconciliationRun",
    editable: false,
    versioned: false,
    columns: ["status", "created_at"],
    fields: [
      {
        name: "period_start",
        label: "Period start",
        required: false,
        type: "date",
      },
      {
        name: "period_end",
        label: "Period end",
        required: false,
        type: "date",
      },
      {
        name: "cash_spent_on_assets",
        label: "Cash spent on assets",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "change_in_register_value",
        label: "Change in register value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "cost_recognised",
        label: "Cost recognised",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "difference",
        label: "Difference",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "balanced",
            label: "Balanced",
          },
          {
            value: "off",
            label: "Off",
          },
        ],
      },
      {
        name: "tolerance",
        label: "Tolerance",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "details",
        label: "Details",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "run_at",
        label: "Run at",
        required: false,
        type: "datetime-local",
      },
    ],
    relations: {},
  },
  {
    key: "capital-profiles",
    title: "Capital profiles",
    model: "costing.AssetCapitalProfile",
    editable: false,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "in_service_date",
        label: "In service date",
        required: false,
        type: "date",
      },
      {
        name: "acquisition_cost",
        label: "Acquisition cost",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "salvage_value",
        label: "Salvage value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "expected_life_hours",
        label: "Expected life hours",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "expected_life_years",
        label: "Expected life years",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
    ],
    relations: {
      asset: "assets",
    },
  },
  {
    key: "depreciation-policies",
    title: "Depreciation policies",
    model: "costing.DepreciationPolicy",
    editable: true,
    versioned: true,
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
        name: "strategy_code",
        label: "Strategy code",
        required: false,
        type: "select",
        options: [
          {
            value: "units_of_production_hours",
            label: "Units of production hours",
          },
          {
            value: "straight_line_daily",
            label: "Straight line daily",
          },
        ],
      },
      {
        name: "params",
        label: "Params",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "version_no",
        label: "Version no",
        required: false,
        type: "number",
        step: "1",
        default: 1,
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
  {
    key: "depreciation-assignments",
    title: "Depreciation assignments",
    model: "costing.AssetDepreciationAssignment",
    editable: false,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "effective_from",
        label: "Effective from",
        required: false,
        type: "date",
      },
      {
        name: "effective_to",
        label: "Effective to",
        required: false,
        type: "date",
      },
      {
        name: "base_book_value",
        label: "Base book value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "remaining_life_hours",
        label: "Remaining life hours",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "remaining_life_years",
        label: "Remaining life years",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "reason",
        label: "Reason",
        required: false,
        type: "textarea",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "policy",
        label: "Policy",
        required: false,
        type: "reference",
        resource: "depreciation-policies",
      },
    ],
    relations: {
      asset: "assets",
      policy: "depreciation-policies",
    },
  },
  {
    key: "depreciation-entries",
    title: "Depreciation entries",
    model: "costing.DepreciationEntry",
    editable: false,
    versioned: false,
    columns: ["asset", "entry_date", "amount", "book_value_after"],
    fields: [
      {
        name: "entry_date",
        label: "Entry date",
        required: false,
        type: "date",
      },
      {
        name: "amount",
        label: "Amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "basis_kind",
        label: "Basis kind",
        required: false,
        type: "select",
        options: [
          {
            value: "hours",
            label: "Hours",
          },
          {
            value: "days",
            label: "Days",
          },
          {
            value: "area",
            label: "Area",
          },
          {
            value: "other",
            label: "Other",
          },
        ],
      },
      {
        name: "basis_qty",
        label: "Basis qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "strategy_code",
        label: "Strategy code",
        required: false,
        type: "text",
      },
      {
        name: "policy_version_no",
        label: "Policy version no",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "book_value_after",
        label: "Book value after",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "asset",
        label: "Asset",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "assignment",
        label: "Assignment",
        required: false,
        type: "reference",
        resource: "depreciation-assignments",
      },
      {
        name: "source_sub_event",
        label: "Source sub event",
        required: false,
        type: "reference",
        resource: "sub-events",
      },
      {
        name: "cost_record",
        label: "Cost record",
        required: false,
        type: "reference",
        resource: "cost-records",
      },
      {
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "depreciation-entries",
      },
    ],
    relations: {
      asset: "assets",
      assignment: "depreciation-assignments",
      source_sub_event: "sub-events",
      cost_record: "cost-records",
      reversal_of: "depreciation-entries",
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

const priority = ["cost-records", "event-summaries", "allocations"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);

for (const resource of resources) {
  if (resource.key === "cost-rules") {
    const params = resource.fields.find((f) => f.name === "params");
    if (params)
      Object.assign(params, {
        type: "object",
        advanced: false,
        label: "Pricing",
        fields: [
          {
            name: "rate",
            label: "Rate",
            type: "number",
            step: "any",
            required: true,
          },
          {
            name: "flow_rate",
            label: "Flow rate (flow estimates only)",
            type: "number",
            step: "any",
          },
        ],
      });
  }
}
