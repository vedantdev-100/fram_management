import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  AvailabilityWindow,
  RestrictionWindow,
} from "@/types/api.generated";
export interface SchedulingModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
