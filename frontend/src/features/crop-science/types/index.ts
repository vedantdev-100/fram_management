import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  CropStageModel,
  CropStage,
  CalendarTemplate,
  CalendarTemplateItem,
  CropCycleCalendar,
  CropStageRecord,
  WeatherDaily,
  GddDaily,
  ThresholdRule,
  Suggestion,
} from "@/types/api.generated";
export interface CropScienceModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
