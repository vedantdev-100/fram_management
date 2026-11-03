import { create } from "zustand";

export type Theme = "light" | "dark";
const STORAGE_KEY = "fieldwork-theme";
function initialTheme(): Theme {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {
    /* Appearance still works when browser storage is unavailable. */
  }
  return window.matchMedia?.("(prefers-color-scheme: dark)").matches
    ? "dark"
    : "light";
}
export const useTheme = create<{ theme: Theme; toggle: () => void }>((set) => ({
  theme: initialTheme(),
  toggle: () => set((s) => ({ theme: s.theme === "dark" ? "light" : "dark" })),
}));
function applyTheme(theme: Theme) {
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}
export function initializeTheme() {
  applyTheme(useTheme.getState().theme);
  return useTheme.subscribe(({ theme }) => {
    applyTheme(theme);
    try {
      localStorage.setItem(STORAGE_KEY, theme);
    } catch {
      /* Session-only preference. */
    }
  });
}
