import type { ResourceDefinition, CommandDefinition } from "@/types";
export type { Role, Membership, Invitation } from "@/types/api.generated";
export interface SettingsModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
