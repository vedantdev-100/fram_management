import { createModuleApi } from "@/api/resources";
export const api = createModuleApi([
  "units",
  "purpose-tags",
  "crops",
  "varieties",
  "product-categories",
  "products",
  "product-crop-labels",
  "grades",
  "counterparties",
]);
