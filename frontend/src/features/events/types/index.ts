import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  EventCategory,
  EventType,
  EventTypeVersion,
  EventTypeLine,
  Event,
  SubEvent,
  EventTarget,
  EventExecution,
  Reservation,
  ObservationDetail,
  StockMovement,
  MeterEntry,
  LivingEntry,
} from "@/types/api.generated";
export interface EventsModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
