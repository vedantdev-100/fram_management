import { apiRequest } from "@/api/client";
import type { SyncResult } from "../types";
export const syncApi = {
  changes: (farm: string, cursor?: string) =>
    apiRequest<SyncResult>(
      `farms/${farm}/sync/${cursor ? "?cursor=" + encodeURIComponent(cursor) : ""}`,
    ),
  batch: (farm: string, events: unknown[]) =>
    apiRequest<{
      results: { client_uuid: string; status: string; error?: string }[];
    }>(`farms/${farm}/sync/`, {
      method: "POST",
      body: JSON.stringify({ events }),
    }),
};
