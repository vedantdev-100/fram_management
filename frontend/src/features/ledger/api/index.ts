import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "accounts",
  "entries",
  "ledger-categories",
  "loans",
  "loan-schedule",
]);
