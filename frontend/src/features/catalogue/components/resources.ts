import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "units",
    title: "Units",
    model: "catalogue.Unit",
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
        name: "dimension",
        label: "Dimension",
        required: false,
        type: "select",
        options: [
          {
            value: "mass",
            label: "Mass",
          },
          {
            value: "volume",
            label: "Volume",
          },
          {
            value: "area",
            label: "Area",
          },
          {
            value: "time",
            label: "Time",
          },
          {
            value: "count",
            label: "Count",
          },
          {
            value: "length",
            label: "Length",
          },
          {
            value: "energy",
            label: "Energy",
          },
        ],
      },
      {
        name: "to_base_factor",
        label: "To base factor",
        required: false,
        type: "number",
        step: "any",
        default: "1",
      },
    ],
    relations: {},
  },
  {
    key: "purpose-tags",
    title: "Purpose tags",
    model: "catalogue.PurposeTag",
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
        name: "sort_order",
        label: "Sort order",
        required: false,
        type: "number",
        step: "1",
      },
    ],
    relations: {},
  },
  {
    key: "crops",
    title: "Crops",
    model: "catalogue.Crop",
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
        name: "scientific_name",
        label: "Scientific name",
        required: false,
        type: "text",
      },
      {
        name: "category",
        label: "Category",
        required: false,
        type: "text",
      },
      {
        name: "lifecycle",
        label: "Lifecycle",
        required: false,
        type: "select",
        options: [
          {
            value: "annual",
            label: "Annual",
          },
          {
            value: "biennial",
            label: "Biennial",
          },
          {
            value: "perennial",
            label: "Perennial",
          },
        ],
      },
      {
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "default_yield_unit",
        label: "Default yield unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      default_yield_unit: "units",
    },
  },
  {
    key: "varieties",
    title: "Varieties",
    model: "catalogue.Variety",
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
        name: "typical_duration_days",
        label: "Typical duration days",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "attributes",
        label: "Attributes",
        required: false,
        type: "json",
        advanced: true,
      },
      {
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
    ],
    relations: {
      crop: "crops",
    },
  },
  {
    key: "product-categories",
    title: "Product categories",
    model: "catalogue.ProductCategory",
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
        name: "is_regulated",
        label: "Is regulated",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "default_purpose_tag",
        label: "Default purpose tag",
        required: false,
        type: "reference",
        resource: "purpose-tags",
        nullable: true,
      },
    ],
    relations: {
      default_purpose_tag: "purpose-tags",
    },
  },
  {
    key: "products",
    title: "Products",
    model: "catalogue.Product",
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
        name: "manufacturer",
        label: "Manufacturer",
        required: false,
        type: "text",
      },
      {
        name: "active_ingredient",
        label: "Active ingredient",
        required: false,
        type: "text",
      },
      {
        name: "formulation",
        label: "Formulation",
        required: false,
        type: "text",
      },
      {
        name: "mode_of_action_group",
        label: "Mode of action group",
        required: false,
        type: "text",
      },
      {
        name: "registration_no",
        label: "Registration no",
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
        name: "is_active",
        label: "Is active",
        required: false,
        type: "boolean",
        default: true,
      },
      {
        name: "category",
        label: "Category",
        required: true,
        type: "reference",
        resource: "product-categories",
      },
      {
        name: "default_unit",
        label: "Default unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      category: "product-categories",
      default_unit: "units",
    },
  },
  {
    key: "product-crop-labels",
    title: "Product crop labels",
    model: "catalogue.ProductCropLabel",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "dose_min",
        label: "Dose min",
        required: false,
        type: "number",
        step: "any",
        help: "Enter the value from the actual product label.",
      },
      {
        name: "dose_max",
        label: "Dose max",
        required: false,
        type: "number",
        step: "any",
        help: "Enter the value from the actual product label.",
      },
      {
        name: "waiting_period_days",
        label: "Waiting period days",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "reentry_hours",
        label: "Reentry hours",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "max_applications_per_cycle",
        label: "Max applications per cycle",
        required: false,
        type: "number",
        step: "1",
        nullable: true,
      },
      {
        name: "min_interval_days",
        label: "Min interval days",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "product",
        label: "Product",
        required: true,
        type: "reference",
        resource: "products",
      },
      {
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
      {
        name: "dose_unit",
        label: "Dose unit",
        required: true,
        type: "reference",
        resource: "units",
      },
      {
        name: "per_area_unit",
        label: "Per area unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      product: "products",
      crop: "crops",
      dose_unit: "units",
      per_area_unit: "units",
    },
  },
  {
    key: "grades",
    title: "Grades",
    model: "catalogue.ProduceGrade",
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
        name: "sort_order",
        label: "Sort order",
        required: false,
        type: "number",
        step: "1",
      },
      {
        name: "crop",
        label: "Crop",
        required: true,
        type: "reference",
        resource: "crops",
      },
    ],
    relations: {
      crop: "crops",
    },
  },
  {
    key: "counterparties",
    title: "Counterparties",
    model: "catalogue.Counterparty",
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
        name: "kind",
        label: "Kind",
        required: false,
        type: "select",
        options: [
          {
            value: "supplier",
            label: "Supplier",
          },
          {
            value: "buyer",
            label: "Buyer",
          },
          {
            value: "landlord",
            label: "Landlord",
          },
          {
            value: "lender",
            label: "Lender",
          },
          {
            value: "labour_contractor",
            label: "Labour contractor",
          },
          {
            value: "government",
            label: "Government",
          },
          {
            value: "other",
            label: "Other",
          },
        ],
      },
      {
        name: "phone",
        label: "Phone",
        required: false,
        type: "text",
      },
      {
        name: "address",
        label: "Address",
        required: false,
        type: "text",
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
    ],
    relations: {},
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

const priority = ["products", "crops", "counterparties", "units"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
