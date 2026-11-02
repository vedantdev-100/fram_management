import { create } from "zustand";
import { persist } from "zustand/middleware";
interface SyncState {
  cursors: Record<string, string>;
  setCursor: (farm: string, cursor: string) => void;
}
export const useSyncState = create<SyncState>()(
  persist(
    (set) => ({
      cursors: {},
      setCursor: (farm, cursor) =>
        set((s) => ({ cursors: { ...s.cursors, [farm]: cursor } })),
    }),
    { name: "fieldwork-sync-cursors" },
  ),
);
