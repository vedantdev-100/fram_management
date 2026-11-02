import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import type { User } from "@/types";
interface Session {
  accessToken: string | null;
  refreshToken: string | null;
  user: User | null;
  mode: "live" | "demo";
  ready: boolean;
  generation: number;
  setTokens: (access: string, refresh?: string) => void;
  setUser: (user: User) => void;
  setReady: (value: boolean) => void;
  startDemo: (user: User) => void;
  clear: () => void;
}
export const useSession = create<Session>()(
  persist(
    (set) => ({
      accessToken: null,
      refreshToken: null,
      user: null,
      mode: "live",
      ready: false,
      generation: 0,
      setTokens: (access, refresh) =>
        set((s) => ({
          accessToken: access,
          refreshToken: refresh ?? s.refreshToken,
          mode: "live",
        })),
      setUser: (user) => set({ user }),
      setReady: (ready) => set({ ready }),
      startDemo: (user) =>
        set({
          mode: "demo",
          user,
          ready: true,
          accessToken: null,
          refreshToken: null,
        }),
      clear: () =>
        set((s) => ({
          accessToken: null,
          refreshToken: null,
          user: null,
          mode: "live",
          ready: true,
          generation: s.generation + 1,
        })),
    }),
    {
      name: "fieldwork-session",
      storage: createJSONStorage(() => sessionStorage),
      partialize: (s) => ({
        refreshToken: s.refreshToken,
        mode: s.mode,
        user: s.mode === "demo" ? s.user : null,
      }),
    },
  ),
);
