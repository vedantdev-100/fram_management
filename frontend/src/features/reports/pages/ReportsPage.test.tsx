import { afterEach, describe, expect, it, vi } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import ReportsPage from "./ReportsPage";
import { useWorkspace } from "@/stores/workspace";
vi.mock("../hooks/useReport", () => ({
  useReport: () => ({ data: [], isLoading: false, isError: false }),
}));
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ has: () => true }),
}));
afterEach(cleanup);
describe("Farm insights tabs", () => {
  it("uses shared tabs and changes the labelled report panel with keyboard navigation", async () => {
    useWorkspace.setState({
      farm: {
        id: "farm-a",
        name: "Test farm",
        slug: "test-farm",
        currency_code: "INR",
        timezone: "Asia/Kolkata",
      },
    });
    render(<ReportsPage />);
    expect(screen.getAllByRole("tab")).toHaveLength(7);
    const first = screen.getByRole("tab", { name: "Crop cycle margin" });
    const second = screen.getByRole("tab", { name: "Operation costs" });
    expect(
      screen.getByRole("tabpanel", { name: "Crop cycle margin" }),
    ).toBeInTheDocument();
    await userEvent.click(first);
    await userEvent.keyboard("{ArrowRight}");
    expect(second).toHaveFocus();
    expect(second).toHaveAttribute("aria-selected", "true");
    expect(
      screen.getByRole("tabpanel", { name: "Operation costs" }),
    ).toHaveClass("resource-tab-panel");
    await userEvent.click(screen.getByRole("tab", { name: "Machine use" }));
    expect(
      screen.getByRole("tabpanel", { name: "Machine use" }),
    ).toBeInTheDocument();
  });
});
