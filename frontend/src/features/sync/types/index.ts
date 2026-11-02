export interface SyncResult {
  cursor: string;
  count: number;
  changes: Record<string, unknown[]>;
}
