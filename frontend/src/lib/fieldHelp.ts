import type { Field } from "@/types";
import { humanize } from "./format";

const descriptions: Record<string, string> = {
  name: "The readable name shown in lists and searches. Choose a name you can easily recognise.",
  code: "A short reference you choose, such as B-01 for a block. Keep it distinct where the farm requires unique codes.",
  description:
    "Add a plain-language explanation so other farm members understand this record.",
  notes: "Optional context or instructions to keep with this record.",
  area_value:
    "The size in the area unit you select. For example, enter 2 and select Acre for a two-acre block.",
  area_unit:
    "The unit for the entered area, such as acre or square metre. The backend converts the area to square metres.",
  area_m2:
    "Area expressed in square metres. This is the canonical area used for calculations.",
  area_source:
    "Entered means the area was typed in. Drawn means the area is based on a saved geographic boundary.",
  soil_type:
    "A descriptive soil label for this block, for example Black cotton soil.",
  parent:
    "The larger record this belongs to. Child farm blocks must be created through the block-splitting action.",
  geometry:
    "A Polygon or MultiPolygon describing the boundary. Use longitude then latitude in WGS84. Preview an imported boundary before applying it.",
  stock_kind:
    "The inventory classification: Input (such as fertilizer or seed), Produce, By-product, Consumable or Packaging. Choose the kind that describes this material.",
  valuation_method:
    "How stock consumption is costed: weighted average uses the average purchase cost; FIFO uses the oldest available purchase lots first. Example: equal quantities at ₹30 and ₹40 average ₹35 per unit.",
  reorder_level:
    "The quantity, in this item's base unit, at or below which stock needs review. For example, 10 with base unit kg means check stock at 10 kg or less. It does not automatically place an order.",
  shelf_life_days:
    "The expected usable life in days. Leave blank if unknown. This is different from a particular purchase lot's expiry date.",
  base_unit:
    "The canonical unit used to count this stock, such as kg, litre or piece. Select a unit with conversion factor 1. If you link a product, its default unit must have the same dimension.",
  product:
    "An optional catalogue description of the material, such as Urea. Create it in Farm catalogue first if you want to link it. The stock asset and stock item are still required for inventory.",
  crop: "The related crop, such as brinjal. Select an existing crop from the catalogue; whether it is required depends on this form.",
  asset:
    "The farm resource this record describes. Create the asset first in Inventory & assets. For stock-item details, its asset class must be Stock.",
  asset_class:
    "The broad resource class, such as Stock, Machine, Person or Space. Create the asset first, then add the matching class-specific details.",
  home_location:
    "The resource's usual location. Choose an existing asset whose class is Space.",
  qty_unit:
    "The measurement unit for this quantity. It must be compatible with the resource and operation.",
  planned_qty:
    "The quantity you expect to use or receive. Record a correction to actual quantity if the work differs from the plan.",
  actual_qty:
    "The quantity actually used or received. Confirmation applies the operation's stock and cost effects.",
  unit_price:
    "The price for one unit of the purchased quantity, not the total purchase price.",
  price_per_unit:
    "The price for one measurement unit. Quantity multiplied by unit price gives the corresponding total.",
  planned_start:
    "When you plan to begin this operation. Use your local date/time; the app sends a timestamp to the backend.",
  planned_end:
    "When you expect to finish. This must be later than the planned start.",
  start_date:
    "The first date of this period. Check that the end date is not earlier.",
  end_date: "The last date of this period. It must not precede the start date.",
  planned_sowing_date:
    "The intended sowing or planting date for this crop cycle.",
  expected_harvest_start:
    "The estimated date harvesting will begin. You can leave it blank if the form allows it.",
  expected_harvest_end:
    "The estimated final harvesting date. This helps define the crop cycle's planned occupancy of a block.",
  to_base_factor:
    "Multiply a quantity in this unit by this factor to convert it to the base unit. Example: 1 tonne × 1000 = 1000 kg.",
  dimension:
    "The type of measurement: mass, volume, area, time, count, and so on. Only compatible dimensions can be converted.",
  version:
    "The record version used to prevent overwriting someone else's changes. Use the latest version; some forms fill this automatically.",
  client_uuid:
    "A unique request reference used to recognise retries and prevent duplicate effects. Keep the same reference when retrying the same operation.",
  amount:
    "The monetary amount in the relevant account or farm currency. Check the payment direction before confirming.",
  currency_code:
    "The three-letter currency code, for example INR for Indian rupees.",
  timezone:
    "The farm's time zone used to display operational timestamps, for example Asia/Kolkata.",
  lot_code:
    "A purchase or production batch reference that helps distinguish stock lots.",
  expiry_date:
    "The expiry date of this particular stock lot. Check the supplier or batch information.",
  rate: "The rate used by this configuration. Check the selected costing basis and unit before entering it.",
  override_reason:
    "Explain why an authorised exception is needed. A reason alone does not grant override permission.",
  is_intercrop:
    "Marks this crop area as intercropping with another crop, rather than exclusive occupation.",
};
export function fieldHelp(field: Field): string {
  const specific = descriptions[field.name];
  if (field.help) return field.help;
  if (specific) return specific;
  const optional = field.required
    ? "This field is required."
    : "This field is optional.";
  if (field.type === "reference")
    return `Select an existing ${humanize(field.resource || field.label).toLowerCase()} record from this farm or the shared catalogue where available. Create the related record in its module first if it is missing. ${optional}`;
  if (field.type === "array")
    return `Add a row for each ${field.label.toLowerCase()} entry. Complete the fields in every row; remove any unused rows. ${optional}`;
  if (field.type === "object")
    return `These fields belong to ${field.label.toLowerCase()}. Complete the relevant values together. ${optional}`;
  if (field.type === "json")
    return `Structured data for ${field.label.toLowerCase()}. Enter valid JSON with quoted keys; use the form's structured controls where available. ${optional}`;
  if (field.type === "select")
    return `Choose the ${field.label.toLowerCase()} classification for this record. Available choices: ${field.options?.map((o) => o.label).join(", ") || "see the dropdown"}. ${optional}`;
  if (field.type === "number")
    return `Enter the numeric ${field.label.toLowerCase()}; use digits without a currency symbol or thousands separators. ${field.step === "1" ? "Use a whole number." : "Decimals are allowed subject to backend validation."} ${optional}`;
  if (field.type === "date" || field.type === "datetime-local")
    return `Choose the ${field.label.toLowerCase()} ${field.type === "date" ? "date" : "date and time"}. ${optional}`;
  if (field.type === "boolean")
    return `Enable this when ${field.label.toLowerCase()} applies to this record; leave it off otherwise.`;
  return `Enter ${field.label.toLowerCase()} for this record. ${optional}`;
}
export function knownFieldHelp(name: string) {
  return descriptions[name];
}

const headings: Record<string, string> = {
  "Inventory & assets":
    "Register farm resources here. Create an Asset first, then add matching stock, machine, person or space details. Purchases and consumption are recorded through Farm work.",
  "Field plan":
    "Create blocks with an entered area, then optionally import and apply reviewed polygon boundaries. Seasons and crop cycles describe what grows in those blocks and when.",
  "Farm work":
    "Plan operations and their resource quantities here. Starting work marks progress; confirmation applies its stock, money and cost effects. Planning alone does not change inventory.",
  Money:
    "Manage financial accounts and transaction records. Confirmed purchase and payment operations create the corresponding financial effects.",
  "Farm catalogue":
    "Maintain reusable crop, product and unit definitions. A catalogue product describes a material; create a stock asset and stock item to track its inventory.",
  "Costs & value":
    "Review cost rules, depreciation policies and calculated costs. Existing versioned policies may require a new version rather than editing in place.",
  "Crop plans":
    "Maintain crop science records, stages, weather and calendar information used to plan and track crop cycles.",
  "Team & settings":
    "Manage farm membership, roles and configuration. The backend checks your permissions before applying changes.",
  Documents:
    "Upload a document and link it to the relevant farm record. Downloads use your authenticated session.",
  "Your fields":
    "A schematic of saved block geometries. Import preview alone does not save a boundary: apply it to a block first. This is not a satellite map.",
  "The work ahead":
    "Upcoming operations and work awaiting review. Open a work record to inspect quantities, start it or confirm its completion.",
  "Growing this season":
    "Crop cycles connect a crop and its planned growing dates to farm blocks. Open a cycle to review its details.",
  "Worth a look":
    "Shortcuts to records that may need attention, including low stock, work awaiting confirmation and field restrictions.",
};
export function headingHelp(title: string, fallback: string): string {
  if (title.startsWith("Good to see you"))
    return "A summary of this farm's crop cycles, unfinished work, recorded land and stock below its reorder level. Open a section to review the underlying records.";
  return headings[title] || fallback;
}
