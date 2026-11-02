import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "accounts",
    title: "Accounts",
    model: "ledger.LedgerAccount",
    editable: true,
    versioned: false,
    columns: ["name", "kind", "opening_balance", "opening_date"],
    fields: [
      {
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "cash",
            label: "Cash",
          },
          {
            value: "bank",
            label: "Bank",
          },
          {
            value: "mobile_wallet",
            label: "Mobile wallet",
          },
          {
            value: "loan_payable",
            label: "Loan payable",
          },
          {
            value: "supplier_credit_payable",
            label: "Supplier credit payable",
          },
          {
            value: "buyer_credit_receivable",
            label: "Buyer credit receivable",
          },
          {
            value: "advance",
            label: "Advance",
          },
        ],
      },
      {
        name: "name",
        label: "Name",
        required: true,
        type: "text",
      },
      {
        name: "opening_balance",
        label: "Opening balance",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "opening_date",
        label: "Opening date",
        required: true,
        type: "date",
      },
      {
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "counterparty",
        label: "Counterparty",
        required: false,
        type: "reference",
        resource: "counterparties",
        nullable: true,
      },
    ],
    relations: {
      counterparty: "counterparties",
    },
  },
  {
    key: "entries",
    title: "Entries",
    model: "ledger.LedgerEntry",
    editable: false,
    versioned: false,
    columns: ["entry_date", "account", "direction", "amount", "status"],
    fields: [
      {
        name: "entry_date",
        label: "Entry date",
        required: false,
        type: "date",
      },
      {
        name: "direction",
        label: "Direction",
        required: false,
        type: "select",
        options: [
          {
            value: "in",
            label: "In",
          },
          {
            value: "out",
            label: "Out",
          },
        ],
      },
      {
        name: "amount",
        label: "Amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "reference_no",
        label: "Reference no",
        required: false,
        type: "text",
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
            value: "cleared",
            label: "Cleared",
          },
        ],
      },
      {
        name: "due_date",
        label: "Due date",
        required: false,
        type: "date",
      },
      {
        name: "memo",
        label: "Memo",
        required: false,
        type: "textarea",
      },
      {
        name: "transfer_group",
        label: "Transfer group",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "client_uuid",
        label: "Client uuid",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "account",
        label: "Account",
        required: false,
        type: "reference",
        resource: "accounts",
      },
      {
        name: "category",
        label: "Category",
        required: false,
        type: "reference",
        resource: "ledger-categories",
      },
      {
        name: "counterparty",
        label: "Counterparty",
        required: false,
        type: "reference",
        resource: "counterparties",
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
        name: "reversal_of",
        label: "Reversal of",
        required: false,
        type: "reference",
        resource: "entries",
      },
    ],
    relations: {
      account: "accounts",
      category: "ledger-categories",
      counterparty: "counterparties",
      sub_event: "sub-events",
      event: "events",
      reversal_of: "entries",
    },
  },
  {
    key: "ledger-categories",
    title: "Ledger categories",
    model: "ledger.LedgerCategory",
    editable: true,
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
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "asset_purchase",
            label: "Asset purchase",
          },
          {
            value: "operating_payment",
            label: "Operating payment",
          },
          {
            value: "loan_principal",
            label: "Loan principal",
          },
          {
            value: "interest",
            label: "Interest",
          },
          {
            value: "sales_receipt",
            label: "Sales receipt",
          },
          {
            value: "subsidy",
            label: "Subsidy",
          },
          {
            value: "other_income",
            label: "Other income",
          },
          {
            value: "transfer",
            label: "Transfer",
          },
        ],
      },
      {
        name: "parent",
        label: "Parent",
        required: false,
        type: "reference",
        resource: "ledger-categories",
        nullable: true,
      },
    ],
    relations: {
      parent: "ledger-categories",
    },
  },
  {
    key: "loans",
    title: "Loans",
    model: "ledger.Loan",
    editable: true,
    versioned: false,
    columns: ["lender", "principal", "interest_rate", "status"],
    fields: [
      {
        name: "principal",
        label: "Principal",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "interest_rate",
        label: "Interest rate",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "rate_basis",
        label: "Rate basis",
        required: false,
        type: "select",
        options: [
          {
            value: "flat",
            label: "Flat",
          },
          {
            value: "reducing",
            label: "Reducing",
          },
        ],
      },
      {
        name: "start_date",
        label: "Start date",
        required: true,
        type: "date",
      },
      {
        name: "term_months",
        label: "Term months",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "purpose",
        label: "Purpose",
        required: false,
        type: "text",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "active",
            label: "Active",
          },
          {
            value: "closed",
            label: "Closed",
          },
        ],
      },
      {
        name: "lender",
        label: "Lender",
        required: true,
        type: "reference",
        resource: "counterparties",
      },
      {
        name: "account",
        label: "Account",
        required: true,
        type: "reference",
        resource: "accounts",
      },
    ],
    relations: {
      lender: "counterparties",
      account: "accounts",
    },
  },
  {
    key: "loan-schedule",
    title: "Loan schedule",
    model: "ledger.LoanScheduleRow",
    editable: false,
    versioned: false,
    columns: ["status", "created_at"],
    fields: [
      {
        name: "due_date",
        label: "Due date",
        required: false,
        type: "date",
      },
      {
        name: "principal_due",
        label: "Principal due",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "interest_due",
        label: "Interest due",
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
            value: "due",
            label: "Due",
          },
          {
            value: "paid",
            label: "Paid",
          },
          {
            value: "overdue",
            label: "Overdue",
          },
        ],
      },
      {
        name: "loan",
        label: "Loan",
        required: false,
        type: "reference",
        resource: "loans",
      },
      {
        name: "ledger_entry",
        label: "Ledger entry",
        required: false,
        type: "reference",
        resource: "entries",
      },
    ],
    relations: {
      loan: "loans",
      ledger_entry: "entries",
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

const priority = ["entries", "accounts", "loans"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
