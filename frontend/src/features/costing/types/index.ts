import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  CostRule,
  AssetCostRuleAssignment,
  CostRecord,
  CostAllocation,
  HoldingAccrualRun,
  AssetValuation,
  EventCostSummary,
  CropCycleCostSummary,
  ReconciliationRun,
  AssetCapitalProfile,
  DepreciationPolicy,
  AssetDepreciationAssignment,
  DepreciationEntry,
} from "@/types/api.generated";
export interface CostingModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
