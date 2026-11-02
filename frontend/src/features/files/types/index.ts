import type { ResourceDefinition, CommandDefinition } from "@/types";
export type { Attachment } from "@/types/api.generated";
export interface FilesModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
