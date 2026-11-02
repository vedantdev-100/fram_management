import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  Asset,
  SpaceDetail,
  MachineDetail,
  PersonDetail,
  StockItem,
  StockLot,
  LivingDetail,
  FlowDetail,
  Tenure,
} from "@/types/api.generated";
export interface AssetsModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
