import type { Row } from "@/types";
export interface OverviewData {
  blocks: Row[];
  cycles: Row[];
  events: Row[];
  stock: Row[];
  truncated: boolean;
  unavailable: string[];
}
