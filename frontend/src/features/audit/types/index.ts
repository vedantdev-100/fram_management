import type { ResourceDefinition, CommandDefinition } from "@/types";
export type { AuditLog, ConfigurationHistory } from "@/types/api.generated";
export interface AuditModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
