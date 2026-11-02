import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "assets",
    title: "Assets",
    model: "assets.Asset",
    editable: true,
    versioned: false,
    columns: ["name", "asset_class", "code", "status"],
    fields: [
      {
        name: "asset_class",
        label: "Asset class",
        required: false,
        type: "select",
        options: [
          {
            value: "space",
            label: "Space",
          },
          {
            value: "machine",
            label: "Machine",
          },
          {
            value: "person",
            label: "Person",
          },
          {
            value: "stock",
            label: "Stock",
          },
          {
            value: "living",
            label: "Living",
          },
          {
            value: "flow",
            label: "Flow",
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
        name: "code",
        label: "Code",
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
        name: "acquired_on",
        label: "Acquired on",
        required: false,
        type: "date",
        nullable: true,
      },
      {
        name: "retired_on",
        label: "Retired on",
        required: false,
        type: "date",
        nullable: true,
      },
      {
        name: "attributes",
        label: "Attributes",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "home_location",
        label: "Home location",
        required: false,
        type: "reference",
        resource: "assets",
        nullable: true,
      },
    ],
    relations: {
      home_location: "assets",
    },
  },
  {
    key: "space-details",
    title: "Space details",
    model: "assets.SpaceDetail",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "space_type",
        label: "Space type",
        required: false,
        type: "select",
        options: [
          {
            value: "land",
            label: "Land",
          },
          {
            value: "shed",
            label: "Shed",
          },
          {
            value: "store",
            label: "Store",
          },
          {
            value: "cold_store",
            label: "Cold store",
          },
          {
            value: "well",
            label: "Well",
          },
          {
            value: "pond",
            label: "Pond",
          },
          {
            value: "other",
            label: "Other",
          },
        ],
      },
      {
        name: "capacity_value",
        label: "Capacity value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "location",
        label: "Location",
        required: false,
        type: "json",
        advanced: true,
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
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
        nullable: true,
      },
      {
        name: "capacity_unit",
        label: "Capacity unit",
        required: false,
        type: "reference",
        resource: "units",
        nullable: true,
      },
    ],
    relations: {
      asset: "assets",
      block: "blocks",
      capacity_unit: "units",
    },
  },
  {
    key: "machine-details",
    title: "Machine details",
    model: "assets.MachineDetail",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "machine_type",
        label: "Machine type",
        required: false,
        type: "text",
      },
      {
        name: "make",
        label: "Make",
        required: false,
        type: "text",
      },
      {
        name: "model",
        label: "Model",
        required: false,
        type: "text",
      },
      {
        name: "year",
        label: "Year",
        required: false,
        type: "number",
        step: "1",
        nullable: true,
      },
      {
        name: "fuel_rate_per_hour",
        label: "Fuel rate per hour",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "capacity_note",
        label: "Capacity note",
        required: false,
        type: "text",
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "fuel_stock_item",
        label: "Fuel stock item",
        required: false,
        type: "reference",
        resource: "stock-items",
        nullable: true,
      },
    ],
    relations: {
      asset: "assets",
      fuel_stock_item: "stock-items",
    },
  },
  {
    key: "person-details",
    title: "Person details",
    model: "assets.PersonDetail",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "person_type",
        label: "Person type",
        required: false,
        type: "select",
        options: [
          {
            value: "family",
            label: "Family",
          },
          {
            value: "permanent",
            label: "Permanent",
          },
          {
            value: "seasonal",
            label: "Seasonal",
          },
          {
            value: "contract",
            label: "Contract",
          },
        ],
      },
      {
        name: "skills",
        label: "Skills",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "phone",
        label: "Phone",
        required: false,
        type: "text",
      },
      {
        name: "wage_basis",
        label: "Wage basis",
        required: false,
        type: "select",
        options: [
          {
            value: "hourly",
            label: "Hourly",
          },
          {
            value: "daily",
            label: "Daily",
          },
          {
            value: "monthly",
            label: "Monthly",
          },
        ],
      },
      {
        name: "is_paid",
        label: "Is paid",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "user",
        label: "User",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
        nullable: true,
      },
    ],
    relations: {
      asset: "assets",
    },
  },
  {
    key: "stock-items",
    title: "Stock items",
    model: "assets.StockItem",
    editable: true,
    versioned: false,
    columns: [
      "asset",
      "stock_kind",
      "on_hand_qty",
      "avg_unit_cost",
      "reorder_level",
    ],
    fields: [
      {
        name: "stock_kind",
        label: "Stock kind",
        required: false,
        type: "select",
        options: [
          {
            value: "input",
            label: "Input",
          },
          {
            value: "produce",
            label: "Produce",
          },
          {
            value: "by_product",
            label: "By product",
          },
          {
            value: "consumable",
            label: "Consumable",
          },
          {
            value: "packaging",
            label: "Packaging",
          },
        ],
      },
      {
        name: "valuation_method",
        label: "Valuation method",
        required: false,
        type: "select",
        options: [
          {
            value: "weighted_average",
            label: "Weighted average",
          },
          {
            value: "FIFO",
            label: "Fifo",
          },
        ],
      },
      {
        name: "reorder_level",
        label: "Reorder level",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "shelf_life_days",
        label: "Shelf life days",
        required: false,
        type: "number",
        step: "1",
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
        name: "product",
        label: "Product",
        required: false,
        type: "reference",
        resource: "products",
        nullable: true,
      },
      {
        name: "crop",
        label: "Crop",
        required: false,
        type: "reference",
        resource: "crops",
        nullable: true,
      },
      {
        name: "base_unit",
        label: "Base unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      asset: "assets",
      product: "products",
      crop: "crops",
      base_unit: "units",
    },
  },
  {
    key: "stock-lots",
    title: "Stock lots",
    model: "assets.StockLot",
    editable: false,
    versioned: false,
    columns: ["lot_code", "stock_item", "remaining_qty", "expiry_date"],
    fields: [
      {
        name: "lot_code",
        label: "Lot code",
        required: false,
        type: "text",
      },
      {
        name: "received_on",
        label: "Received on",
        required: false,
        type: "date",
      },
      {
        name: "expiry_date",
        label: "Expiry date",
        required: false,
        type: "date",
      },
      {
        name: "initial_qty",
        label: "Initial qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "unit_cost",
        label: "Unit cost",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "source_sub_event_id",
        label: "Source sub event id",
        required: false,
        type: "text",
        help: "Linked record ID. Select it in the related module first.",
      },
      {
        name: "stock_item",
        label: "Stock item",
        required: false,
        type: "reference",
        resource: "stock-items",
      },
      {
        name: "supplier",
        label: "Supplier",
        required: false,
        type: "reference",
        resource: "counterparties",
      },
      {
        name: "storage_location",
        label: "Storage location",
        required: false,
        type: "reference",
        resource: "assets",
      },
      {
        name: "grade",
        label: "Grade",
        required: false,
        type: "reference",
        resource: "grades",
      },
    ],
    relations: {
      stock_item: "stock-items",
      supplier: "counterparties",
      storage_location: "assets",
      grade: "grades",
    },
  },
  {
    key: "living-details",
    title: "Living details",
    model: "assets.LivingDetail",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "living_type",
        label: "Living type",
        required: false,
        type: "select",
        options: [
          {
            value: "animal_group",
            label: "Animal group",
          },
          {
            value: "single_animal",
            label: "Single animal",
          },
          {
            value: "orchard",
            label: "Orchard",
          },
          {
            value: "tree_block",
            label: "Tree block",
          },
        ],
      },
      {
        name: "species",
        label: "Species",
        required: false,
        type: "text",
      },
      {
        name: "start_date",
        label: "Start date",
        required: true,
        type: "date",
      },
      {
        name: "lifecycle_stage",
        label: "Lifecycle stage",
        required: false,
        type: "text",
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
        nullable: true,
      },
    ],
    relations: {
      asset: "assets",
      block: "blocks",
    },
  },
  {
    key: "flow-details",
    title: "Flow details",
    model: "assets.FlowDetail",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "flow_type",
        label: "Flow type",
        required: false,
        type: "select",
        options: [
          {
            value: "water",
            label: "Water",
          },
          {
            value: "electricity",
            label: "Electricity",
          },
          {
            value: "diesel_feed",
            label: "Diesel feed",
          },
          {
            value: "solar",
            label: "Solar",
          },
        ],
      },
      {
        name: "source_description",
        label: "Source description",
        required: false,
        type: "text",
      },
      {
        name: "rated_capacity",
        label: "Rated capacity",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "is_metered",
        label: "Is metered",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "asset",
        label: "Asset",
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "unit",
        label: "Unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      asset: "assets",
      unit: "units",
    },
  },
  {
    key: "tenures",
    title: "Tenures",
    model: "assets.Tenure",
    editable: true,
    versioned: false,
    columns: ["asset", "created_at"],
    fields: [
      {
        name: "tenure_kind",
        label: "Tenure kind",
        required: false,
        type: "select",
        options: [
          {
            value: "owned",
            label: "Owned",
          },
          {
            value: "leased_in",
            label: "Leased in",
          },
          {
            value: "leased_out",
            label: "Leased out",
          },
          {
            value: "shared_crop",
            label: "Shared crop",
          },
          {
            value: "borrowed",
            label: "Borrowed",
          },
          {
            value: "hired",
            label: "Hired",
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
        name: "end_date",
        label: "End date",
        required: false,
        type: "date",
        nullable: true,
      },
      {
        name: "rent_amount",
        label: "Rent amount",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "rent_period",
        label: "Rent period",
        required: false,
        type: "select",
        options: [
          {
            value: "day",
            label: "Day",
          },
          {
            value: "month",
            label: "Month",
          },
          {
            value: "year",
            label: "Year",
          },
          {
            value: "season",
            label: "Season",
          },
        ],
      },
      {
        name: "payment_terms",
        label: "Payment terms",
        required: false,
        type: "text",
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
        required: true,
        type: "reference",
        resource: "assets",
      },
      {
        name: "owner_party",
        label: "Owner party",
        required: false,
        type: "reference",
        resource: "counterparties",
        nullable: true,
      },
      {
        name: "holder_party",
        label: "Holder party",
        required: false,
        type: "reference",
        resource: "counterparties",
        nullable: true,
      },
      {
        name: "user_party",
        label: "User party",
        required: false,
        type: "reference",
        resource: "counterparties",
        nullable: true,
      },
    ],
    relations: {
      asset: "assets",
      owner_party: "counterparties",
      holder_party: "counterparties",
      user_party: "counterparties",
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

const priority = ["stock-items", "assets", "stock-lots"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
