import type { ResourceDefinition, CommandDefinition } from "@/types";
export type {
  LedgerAccount,
  LedgerEntry,
  LedgerCategory,
  Loan,
  LoanScheduleRow,
} from "@/types/api.generated";
export interface LedgerModule {
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
}
