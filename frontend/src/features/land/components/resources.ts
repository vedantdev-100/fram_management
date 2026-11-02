import type { ResourceDefinition } from "@/types";
export const resources: ResourceDefinition[] = [
  {
    key: "blocks",
    title: "Blocks",
    model: "land.Block",
    editable: true,
    versioned: false,
    columns: ["name", "code", "area_m2", "soil_type", "status"],
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
        name: "area_value",
        label: "Area value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "area_source",
        label: "Area source",
        required: false,
        type: "select",
        options: [
          {
            value: "entered",
            label: "Entered",
          },
          {
            value: "drawn",
            label: "Drawn",
          },
        ],
      },
      {
        name: "soil_type",
        label: "Soil type",
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
            value: "fallow",
            label: "Fallow",
          },
          {
            value: "retired",
            label: "Retired",
          },
        ],
      },
      {
        name: "notes",
        label: "Notes",
        required: false,
        type: "textarea",
      },
      {
        name: "parent",
        label: "Parent",
        required: false,
        type: "reference",
        resource: "blocks",
        nullable: true,
      },
      {
        name: "area_unit",
        label: "Area unit",
        required: true,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      parent: "blocks",
      area_unit: "units",
    },
  },
  {
    key: "block-boundaries",
    title: "Block boundaries",
    model: "land.BlockBoundaryRevision",
    editable: false,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "source",
        label: "Source",
        required: false,
        type: "select",
        options: [
          {
            value: "drawn",
            label: "Drawn",
          },
          {
            value: "imported",
            label: "Imported",
          },
          {
            value: "gps",
            label: "Gps",
          },
        ],
      },
      {
        name: "effective_from",
        label: "Effective from",
        required: false,
        type: "datetime-local",
      },
      {
        name: "note",
        label: "Note",
        required: false,
        type: "text",
      },
      {
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
      },
    ],
    relations: {
      block: "blocks",
    },
  },
  {
    key: "block-access",
    title: "Block access",
    model: "land.BlockAccess",
    editable: true,
    versioned: false,
    columns: ["created_at"],
    fields: [
      {
        name: "access_level",
        label: "Access level",
        required: false,
        type: "select",
        options: [
          {
            value: "view",
            label: "View",
          },
          {
            value: "record",
            label: "Record",
          },
          {
            value: "manage",
            label: "Manage",
          },
        ],
      },
      {
        name: "membership",
        label: "Membership",
        required: true,
        type: "reference",
        resource: "members",
      },
      {
        name: "block",
        label: "Block",
        required: true,
        type: "reference",
        resource: "blocks",
      },
    ],
    relations: {
      membership: "members",
      block: "blocks",
    },
  },
  {
    key: "seasons",
    title: "Seasons",
    model: "land.Season",
    editable: true,
    versioned: false,
    columns: ["name", "status", "created_at"],
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
        type: "text",
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
        required: true,
        type: "date",
      },
      {
        name: "status",
        label: "Status",
        required: false,
        type: "select",
        options: [
          {
            value: "planned",
            label: "Planned",
          },
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
    ],
    relations: {},
  },
  {
    key: "crop-cycles",
    title: "Crop cycles",
    model: "land.CropCycle",
    editable: false,
    versioned: false,
    columns: [
      "name",
      "crop",
      "status",
      "planned_sowing_date",
      "expected_harvest_end",
    ],
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
        name: "planned_sowing_date",
        label: "Planned sowing date",
        required: false,
        type: "date",
      },
      {
        name: "actual_sowing_date",
        label: "Actual sowing date",
        required: false,
        type: "date",
      },
      {
        name: "expected_harvest_start",
        label: "Expected harvest start",
        required: false,
        type: "date",
      },
      {
        name: "expected_harvest_end",
        label: "Expected harvest end",
        required: false,
        type: "date",
      },
      {
        name: "actual_harvest_end",
        label: "Actual harvest end",
        required: false,
        type: "date",
      },
      {
        name: "expected_yield_qty",
        label: "Expected yield qty",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "expected_price_per_unit",
        label: "Expected price per unit",
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
        name: "season",
        label: "Season",
        required: false,
        type: "reference",
        resource: "seasons",
      },
      {
        name: "crop",
        label: "Crop",
        required: false,
        type: "reference",
        resource: "crops",
      },
      {
        name: "variety",
        label: "Variety",
        required: false,
        type: "reference",
        resource: "varieties",
      },
      {
        name: "expected_yield_unit",
        label: "Expected yield unit",
        required: false,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      season: "seasons",
      crop: "crops",
      variety: "varieties",
      expected_yield_unit: "units",
    },
  },
  {
    key: "crop-cycle-blocks",
    title: "Crop cycle blocks",
    model: "land.CropCycleBlock",
    editable: false,
    versioned: false,
    columns: ["crop_cycle", "created_at"],
    fields: [
      {
        name: "area_value",
        label: "Area value",
        required: false,
        type: "number",
        step: "any",
      },
      {
        name: "is_intercrop",
        label: "Is intercrop",
        required: false,
        type: "boolean",
        default: false,
      },
      {
        name: "crop_cycle",
        label: "Crop cycle",
        required: false,
        type: "reference",
        resource: "crop-cycles",
      },
      {
        name: "block",
        label: "Block",
        required: false,
        type: "reference",
        resource: "blocks",
      },
      {
        name: "area_unit",
        label: "Area unit",
        required: false,
        type: "reference",
        resource: "units",
      },
    ],
    relations: {
      crop_cycle: "crop-cycles",
      block: "blocks",
      area_unit: "units",
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

const priority = ["blocks", "crop-cycles", "seasons"];
resources.sort(
  (a, b) =>
    (priority.includes(a.key) ? priority.indexOf(a.key) : 100) -
    (priority.includes(b.key) ? priority.indexOf(b.key) : 100),
);
