import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  TreatmentRecord,
  ComplianceCheck,
  ComplianceOverride,
} from "@/types/api.generated";
export interface ComplianceModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
