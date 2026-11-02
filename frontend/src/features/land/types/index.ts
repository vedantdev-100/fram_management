import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  Block,
  BlockBoundaryRevision,
  BlockAccess,
  Season,
  CropCycle,
  CropCycleBlock,
} from "@/types/api.generated";
export interface LandModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
