import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "cost-rules",
  "cost-rule-assignments",
  "cost-records",
  "allocations",
  "holding-runs",
  "valuations",
  "event-summaries",
  "cycle-summaries",
  "reconciliation-runs",
  "capital-profiles",
  "depreciation-policies",
  "depreciation-assignments",
  "depreciation-entries",
]);
