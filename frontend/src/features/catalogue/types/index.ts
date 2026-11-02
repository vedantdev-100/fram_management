import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  Unit,
  PurposeTag,
  Crop,
  Variety,
  ProductCategory,
  Product,
  ProductCropLabel,
  ProduceGrade,
  Counterparty,
} from "@/types/api.generated";
export interface CatalogueModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
