import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "categories",
  "types",
  "type-versions",
  "type-lines",
  "events",
  "sub-events",
  "targets",
  "executions",
  "reservations",
  "observations",
  "stock-movements",
  "meter-entries",
  "living-entries",
]);
