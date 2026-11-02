import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  Scenario,
  ScenarioAssumption,
  ScenarioCropCycle,
  ScenarioMetric,
  DecisionJournal,
  InvestmentAnalysis,
} from "@/types/api.generated";
export interface WorkbenchModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
