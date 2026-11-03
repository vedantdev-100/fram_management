// Navigation guidance only; validation and domain operations remain in features/backend.
export interface SetupStep {
  title: string;
  text: string;
  href: string;
  optional?: boolean;
}
export interface SetupGuideDefinition {
  title: string;
  introduction: string;
  steps: SetupStep[];
  note?: string;
}
export const setupGuides: Record<string, SetupGuideDefinition> = {
  "/": {
    title: "Set up your farm, one step at a time",
    introduction:
      "Start with the land and catalogue, register your resources, then record the work. You can return to any step later.",
    steps: [
      {
        title: "Define the land",
        text: "Create blocks and enter their areas. Add reviewed boundaries if available.",
        href: "/land?tab=blocks",
      },
      {
        title: "Prepare the catalogue",
        text: "Check units and add the crops, varieties and products you use.",
        href: "/catalogue",
      },
      {
        title: "Register resources",
        text: "Create assets, then their matching stock, machine or person details.",
        href: "/assets?tab=assets",
      },
      {
        title: "Plan and record work",
        text: "Create crop cycles and operations. Confirm completed work to post its effects.",
        href: "/events",
      },
      {
        title: "Review the results",
        text: "Check stock, money and farm insights after recording operations.",
        href: "/reports",
      },
    ],
    note: "These steps are a guide, not completion indicators. Preview records are separate from your live farm.",
  },
  "/land": {
    title: "Set up your fields and growing season",
    introduction:
      "Blocks describe where you farm; seasons and crop cycles describe what grows there and when.",
    steps: [
      {
        title: "Create a block",
        text: "Enter a unique code, a name, area and area unit for each field.",
        href: "/land?tab=blocks",
      },
      {
        title: "Apply a boundary",
        text: "Import a Polygon, review it and apply it to an existing block.",
        href: "/land?tab=blocks",
        optional: true,
      },
      {
        title: "Create a season",
        text: "Set the season name and its start and end dates.",
        href: "/land?tab=seasons",
      },
      {
        title: "Create a crop cycle",
        text: "Choose the season, crop, variety and dates, then assign leaf blocks.",
        href: "/land?tab=crop-cycles&action=create_crop_cycle",
      },
    ],
    note: "Add crops and varieties in Farm catalogue before selecting them. Boundary preview alone does not save geometry; split child blocks through the split action.",
  },
  "/assets": {
    title: "From a farm resource to usable inventory",
    introduction:
      "A product is a catalogue description. An asset is your farm resource. Its detail record tells the app how to track it.",
    steps: [
      {
        title: "Check catalogue & units",
        text: "Use an existing base unit. Add a catalogue product if you want a product link.",
        href: "/catalogue?tab=products",
        optional: true,
      },
      {
        title: "Create the asset",
        text: "Name the resource and select Stock, Machine, Person or another asset class.",
        href: "/assets?tab=assets",
      },
      {
        title: "Add matching details",
        text: "For Stock, create a stock item and link the asset, base unit and valuation method.",
        href: "/assets?tab=stock-items",
      },
      {
        title: "Record a purchase",
        text: "Plan a purchase with quantity and price, then start and confirm it to add stock.",
        href: "/events?tab=events&action=create_event",
      },
      {
        title: "Record its use",
        text: "Record and confirm consumption or resource use in farm work.",
        href: "/events",
      },
    ],
    note: "Machine → Machine details. Person → Person details. Space → Space details. Creating an asset or stock item alone does not add stock quantity. Add a money account before recording payment.",
  },
  "/events": {
    title: "Plan → start → confirm the work",
    introduction:
      "Prepare the referenced records first. Planning an operation reserves its intent; confirmation applies its business effects.",
    steps: [
      {
        title: "Prepare the resources",
        text: "Create assets and matching details. Purchases with payment also need an account.",
        href: "/assets?tab=assets",
      },
      {
        title: "Prepare the field",
        text: "For crop work, create the block and crop cycle the operation belongs to.",
        href: "/land?tab=crop-cycles",
      },
      {
        title: "Plan the operation",
        text: "Choose the event type, schedule, targets and resource quantities.",
        href: "/events?tab=events&action=create_event",
      },
      {
        title: "Start & record actuals",
        text: "Open the planned event, start it and correct quantities to match the work.",
        href: "/events?tab=events",
      },
      {
        title: "Confirm & review",
        text: "Submit for review if needed, then confirm. Check the resulting stock and cost.",
        href: "/events?tab=events",
      },
    ],
    note: "Not every event needs a crop cycle. Choose targets relevant to that operation. Unfinished work can be cancelled; confirmed history uses correction actions.",
  },
  "/ledger": {
    title: "Prepare accounts before recording payments",
    introduction:
      "Create the accounts you use, then record receipts, payments and transfers through their actions.",
    steps: [
      {
        title: "Check categories",
        text: "Review the seeded income and expense categories; add farm categories if needed.",
        href: "/ledger?tab=ledger-categories",
      },
      {
        title: "Create an account",
        text: "Add your cash or bank account with the correct currency.",
        href: "/ledger?tab=accounts",
      },
      {
        title: "Record the transaction",
        text: "Use a payment action or a purchase operation with payment details.",
        href: "/ledger?action=record_payment",
      },
      {
        title: "Review entries",
        text: "Inspect the posted entries and balances. A planned purchase has not posted yet.",
        href: "/ledger?tab=entries",
      },
    ],
    note: "Accounts and categories describe your setup; they are not transactions. Money changes only when the corresponding operation is posted or confirmed.",
  },
  "/reports": {
    title: "Build useful insights from recorded work",
    introduction:
      "Reports reflect the data you have entered. An empty report can simply mean the farm has no matching operations yet.",
    steps: [
      {
        title: "Set up fields & cycles",
        text: "Record blocks and the growing cycles you want to analyse.",
        href: "/land",
      },
      {
        title: "Record operations",
        text: "Enter purchases, usage, labour, harvests and payments as relevant.",
        href: "/events",
      },
      {
        title: "Confirm completed work",
        text: "Review actual quantities and confirm operations so their effects are recorded.",
        href: "/events",
      },
      {
        title: "Choose & export a report",
        text: "Select the report and available filters below. Review the results or download CSV.",
        href: "/reports",
      },
    ],
  },
  "/crop-science": {
    title: "Prepare a crop cycle before its calendar",
    introduction:
      "Crop plans connect catalogue definitions and crop cycles with calendar, stage and weather records.",
    steps: [
      {
        title: "Add crops & varieties",
        text: "Check that the crop and variety exist in the farm catalogue.",
        href: "/catalogue?tab=crops",
      },
      {
        title: "Create the crop cycle",
        text: "Choose a season, growing dates and blocks for the crop.",
        href: "/land?tab=crop-cycles",
      },
      {
        title: "Prepare a calendar template",
        text: "Create or review a template and its applicable operations.",
        href: "/crop-science?tab=calendar-templates",
      },
      {
        title: "Build & review calendar",
        text: "Select the crop cycle and template in the calendar action. Review the generated records.",
        href: "/crop-science?action=generate_calendar",
      },
      {
        title: "Track field progress",
        text: "Record observed stages and weather; recalculate GDD when records are ready.",
        href: "/crop-science?tab=weather",
      },
    ],
    note: "Stage and weather records support tracking; a calendar is a plan and does not mean the field work has been completed.",
  },
  "/scheduling": {
    title: "Describe when resources can be used",
    introduction:
      "Availability records describe working windows; restriction records describe periods to avoid.",
    steps: [
      {
        title: "Register resources",
        text: "Create the relevant machine, person or space assets first.",
        href: "/assets?tab=assets",
      },
      {
        title: "Add availability",
        text: "Record explicit start/end windows for the relevant resources.",
        href: "/scheduling?tab=availability-windows",
      },
      {
        title: "Review restrictions",
        text: "Check applicable restriction windows before scheduling work.",
        href: "/scheduling?tab=restriction-windows",
      },
      {
        title: "Plan the operation",
        text: "Schedule work with the relevant resources and review backend conflicts.",
        href: "/events?tab=events&action=create_event",
      },
    ],
    note: "Use explicit windows; this backend does not expand availability recurrence rules automatically. Restrictions may also be generated by confirmed treatments.",
  },
  "/workbench": {
    title: "Compare a plan before adopting it",
    introduction:
      "Use a scenario to keep planning assumptions and comparisons together.",
    steps: [
      {
        title: "Create a scenario",
        text: "Give the proposed plan a name and context.",
        href: "/workbench?tab=scenarios",
      },
      {
        title: "Add assumptions",
        text: "Record the scenario's input assumptions and draft crop-cycle links.",
        href: "/workbench?tab=assumptions",
      },
      {
        title: "Calculate metrics",
        text: "Run the metrics action for the chosen scenario and review the result.",
        href: "/workbench?action=compute_metrics",
      },
      {
        title: "Record a decision",
        text: "Keep the decision and reasoning; use adoption only after reviewing the plan.",
        href: "/workbench?tab=decisions",
      },
    ],
    note: "Scenario-cycle links require draft crop cycles. Investment analyses are a separate calculator available in this section; forecasts depend on your assumptions.",
  },
  "/costing": {
    title: "Set rates before reviewing calculated costs",
    introduction:
      "Cost configuration supplies the rates and policies used when farm operations are confirmed.",
    steps: [
      {
        title: "Register the resource",
        text: "Add the asset and its matching details before configuring its costs.",
        href: "/assets?tab=assets",
      },
      {
        title: "Create a cost rule",
        text: "Define the costing basis and rate for the resource or operation.",
        href: "/costing?tab=cost-rules",
      },
      {
        title: "Assign the rule",
        text: "Link the appropriate rate or policy through the assignment records.",
        href: "/costing?tab=cost-rule-assignments",
      },
      {
        title: "Confirm the work",
        text: "Record actual usage and confirm the operation to create applicable cost records.",
        href: "/events",
      },
      {
        title: "Review & reconcile",
        text: "Inspect calculated costs and run reconciliation for the relevant dates.",
        href: "/costing?tab=reconciliation-runs",
      },
    ],
    note: "For owned capital assets, configure depreciation separately when applicable. Existing versioned cost rules and depreciation policies require a new version rather than direct editing.",
  },
  "/compliance": {
    title: "Prepare treatment information before field application",
    introduction:
      "The treatment register records applicable products, application details and backend safety-check results.",
    steps: [
      {
        title: "Prepare product records",
        text: "Add the product and its applicable crop label information in the catalogue.",
        href: "/catalogue?tab=products",
      },
      {
        title: "Prepare stock & crop",
        text: "Set up the stock item and the field/crop cycle being treated.",
        href: "/assets?tab=stock-items",
      },
      {
        title: "Record the operation",
        text: "Enter treatment details and relevant targets when planning farm work.",
        href: "/events?tab=events&action=create_event",
      },
      {
        title: "Review checks & register",
        text: "Review validation results and confirmed treatment records, including restrictions.",
        href: "/compliance?tab=treatments",
      },
    ],
    note: "Only authorised users may apply permitted overrides. This workflow describes app setup; it is not a pesticide recommendation or substitute for the product label.",
  },
  "/files": {
    title: "Attach documents to the records they explain",
    introduction:
      "Keep invoices, field evidence and other documents linked to the right farm record.",
    steps: [
      {
        title: "Create the target record",
        text: "Save the relevant block, asset, operation or other supported record first.",
        href: "/land",
      },
      {
        title: "Upload a document",
        text: "Use Upload document below, choose its target and select a supported file.",
        href: "/files",
      },
      {
        title: "Review the attachment",
        text: "Open the document record to check its name, kind and target details.",
        href: "/files",
      },
      {
        title: "Download when needed",
        text: "Use the document detail's Download action. Access follows backend permissions.",
        href: "/files",
      },
    ],
    note: "To import geographic boundaries, use Field plan → Import boundary. Uploading GeoJSON as a document does not apply it as a block boundary.",
  },
};
