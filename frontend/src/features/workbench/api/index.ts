import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "scenarios",
  "assumptions",
  "scenario-cycles",
  "metrics",
  "decisions",
  "investment-analyses",
]);
