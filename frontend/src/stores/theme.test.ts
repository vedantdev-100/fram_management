import { afterEach, describe, expect, it, vi } from "vitest";
import { initializeTheme, useTheme } from "./theme";
afterEach(() => {
  localStorage.clear();
  useTheme.setState({ theme: "light" });
  vi.restoreAllMocks();
});
describe("appearance preference", () => {
  it("applies the theme and saves changes outside the auth session", () => {
    useTheme.setState({ theme: "light" });
    const dispose = initializeTheme();
    useTheme.getState().toggle();
    expect(document.documentElement.dataset.theme).toBe("dark");
    expect(document.documentElement.style.colorScheme).toBe("dark");
    expect(localStorage.getItem("fieldwork-theme")).toBe("dark");
    useTheme.getState().toggle();
    expect(document.documentElement.dataset.theme).toBe("light");
    expect(localStorage.getItem("fieldwork-theme")).toBe("light");
    dispose();
  });
  it("still changes appearance when storage is blocked", () => {
    useTheme.setState({ theme: "light" });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("blocked");
    });
    const dispose = initializeTheme();
    expect(() => useTheme.getState().toggle()).not.toThrow();
    expect(document.documentElement.dataset.theme).toBe("dark");
    dispose();
  });
});
