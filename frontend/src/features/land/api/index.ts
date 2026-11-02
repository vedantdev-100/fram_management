import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "blocks",
  "block-boundaries",
  "block-access",
  "seasons",
  "crop-cycles",
  "crop-cycle-blocks",
]);
