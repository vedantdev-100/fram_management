import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Farm } from "@/types";
interface Workspace {
  farm: Farm | null;
  sidebarOpen: boolean;
  sidebarCollapsed: boolean;
  toggleSidebarCollapsed: () => void;
  setFarm: (farm: Farm | null) => void;
  setSidebar: (open: boolean) => void;
}
export const useWorkspace = create<Workspace>()(
  persist(
    (set) => ({
      farm: null,
      sidebarOpen: false,
      sidebarCollapsed: false,
      toggleSidebarCollapsed: () =>
        set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
      setFarm: (farm) => set({ farm }),
      setSidebar: (sidebarOpen) => set({ sidebarOpen }),
    }),
    {
      name: "fieldwork-workspace",
      partialize: (s) => ({
        farm: s.farm,
        sidebarCollapsed: s.sidebarCollapsed,
      }),
    },
  ),
);
