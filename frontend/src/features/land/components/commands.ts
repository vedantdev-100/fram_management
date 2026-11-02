import { localDateTime as commandClock } from "@/lib/format";
import type { CommandDefinition } from "@/types";
import { today } from "@/lib/format";
export const commands: CommandDefinition[] = [
  {
    key: "create_crop_cycle",
    label: "Start a crop cycle",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "cycle",
        label: "Cycle",
        type: "object",
        required: true,
        fields: [
          {
            name: "season",
            label: "Season",
            type: "reference",
            required: true,
            resource: "seasons",
          },
          {
            name: "crop",
            label: "Crop",
            type: "reference",
            required: true,
            resource: "crops",
          },
          {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
          },
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            default: "Brinjal local cycle",
          },
          {
            name: "planned_sowing_date",
            label: "Planned sowing date",
            type: "date",
            required: true,
            default: () => today(),
          },
          {
            name: "expected_harvest_end",
            label: "Expected harvest end",
            type: "text",
            required: true,
          },
          {
            name: "expected_yield_qty",
            label: "Expected yield qty",
            type: "number",
            required: true,
            step: "any",
            default: "10000",
          },
          {
            name: "expected_yield_unit",
            label: "Expected yield unit",
            type: "reference",
            required: true,
            resource: "units",
          },
          {
            name: "expected_price_per_unit",
            label: "Expected price per unit",
            type: "number",
            required: true,
            step: "any",
            default: "20",
          },
        ],
      },
      {
        name: "blocks",
        label: "Blocks",
        type: "array",
        required: true,
        fields: [
          {
            name: "block",
            label: "Block",
            type: "reference",
            required: true,
            resource: "blocks",
          },
          {
            name: "area_value",
            label: "Area value",
            type: "number",
            required: true,
            step: "any",
            default: "2",
          },
          {
            name: "area_unit",
            label: "Area unit",
            type: "reference",
            required: true,
            resource: "units",
          },
        ],
        default: [{}],
      },
    ],
    resource: "crop-cycles",
    build: (values) => ({ ...values }),
  },
  {
    key: "attach_blocks",
    label: "Allocate crop blocks",
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
        name: "blocks",
        label: "Blocks",
        type: "array",
        required: true,
        fields: [
          {
            name: "block",
            label: "Block",
            type: "reference",
            required: true,
            resource: "blocks",
          },
          {
            name: "area_value",
            label: "Area value",
            type: "number",
            required: true,
            step: "any",
            default: "2",
          },
          {
            name: "area_unit",
            label: "Area unit",
            type: "reference",
            required: true,
            resource: "units",
          },
        ],
        default: [{}],
      },
    ],
    resource: "crop-cycles",
    build: (values) => ({ ...values }),
  },
  {
    key: "close_cycle",
    label: "Close a crop cycle",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Requires no outstanding planned/in-progress events.",
    fields: [
      {
        name: "cycle_id",
        label: "Cycle id",
        type: "reference",
        required: true,
        resource: "crop-cycles",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
    ],
    resource: "crop-cycles",
    build: (values) => ({ ...values }),
  },
  {
    key: "set_boundary",
    label: "Save a boundary",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Geometry changes the block\u2019s canonical area. Do this before attaching a full-area cycle or use a separate map-test block.",
    fields: [
      {
        name: "block_id",
        label: "Block id",
        type: "reference",
        required: true,
        resource: "blocks",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "geometry",
        label: "Geometry",
        type: "json",
        required: true,
        help: "Paste reviewed GeoJSON from a map or boundary import. Coordinates are longitude, latitude.",
      },
      {
        name: "source",
        label: "Source",
        type: "select",
        required: true,
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
        default: "drawn",
      },
      {
        name: "note",
        label: "Note",
        type: "text",
        required: true,
        default: "Reviewed local boundary",
      },
    ],
    resource: "blocks",
    build: (values) => ({ ...values }),
  },
  {
    key: "split_block",
    label: "Split an empty block",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending. Use a separate empty block with the illustrated boundary, and no active crop cycle. Splitting the main test block is not part of the guided test.",
    fields: [
      {
        name: "block_id",
        label: "Block id",
        type: "reference",
        required: true,
        resource: "blocks",
      },
      {
        name: "version",
        label: "Version",
        type: "number",
        required: true,
        step: "1",
        default: 1,
        help: "Loaded from the selected record when available.",
      },
      {
        name: "children",
        label: "Children",
        type: "array",
        required: true,
        fields: [
          {
            name: "code",
            label: "Code",
            type: "text",
            required: true,
          },
          {
            name: "name",
            label: "Name",
            type: "text",
            required: true,
            default: "West child",
          },
          {
            name: "geometry",
            label: "Geometry",
            type: "json",
            required: true,
            help: "Paste reviewed GeoJSON from a map or boundary import. Coordinates are longitude, latitude.",
          },
        ],
        default: [{}],
      },
    ],
    resource: "blocks",
    build: (values) => ({ ...values }),
  },
  {
    key: "preview_boundary",
    label: "Check a boundary",
    description:
      "Source-backed service command. Fill prerequisite IDs and current versions before sending.",
    fields: [
      {
        name: "geometry",
        label: "Geometry",
        type: "json",
        required: true,
        help: "Paste reviewed GeoJSON from a map or boundary import. Coordinates are longitude, latitude.",
      },
    ],
    resource: "blocks",
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
  create_crop_cycle:
    "Choose the crop, season and blocks. A crop cycle connects the work, costs and harvest for this enterprise.",
  attach_blocks:
    "Allocate leaf blocks to a draft or planned crop cycle. The server checks available area.",
  close_cycle:
    "Close this crop cycle after its outstanding work has been completed or cancelled.",
  preview_boundary:
    "Validate a GeoJSON boundary and inspect the repaired result before saving.",
  set_boundary:
    "Save a reviewed boundary. The block area is recalculated and a boundary revision is kept.",
  split_block:
    "Split an empty leaf block into reviewed child boundaries. Close active crop cycles before splitting.",
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
