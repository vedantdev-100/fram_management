import type { ResourceDefinition, CommandDefinition } from "@/types";
export type { Notification, ReminderRule } from "@/types/api.generated";
export interface NotificationsModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
