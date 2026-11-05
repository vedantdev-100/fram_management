import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { FarmSwitcher } from "./FarmSwitcher";
import { useWorkspace } from "@/stores/workspace";
vi.mock("@/hooks/usePermissions", () => ({
  usePermissions: () => ({ has: () => true }),
}));
const farms = [
  {
    id: "one",
    slug: "umred-farm",
    name: "Umred Farm with a long readable name",
    currency_code: "INR",
    timezone: "Asia/Kolkata",
  },
  {
    id: "two",
    slug: "west-field",
    name: "West Field",
    currency_code: "INR",
    timezone: "Asia/Kolkata",
  },
];
vi.mock("../hooks/useFarms", () => ({
  useFarms: () => ({ data: farms, isLoading: false, isError: false }),
}));
beforeEach(() => useWorkspace.setState({ farm: farms[0] }));
afterEach(cleanup);
describe("workspace picker", () => {
  it("searches farm names and marks the active workspace", async () => {
    render(<FarmSwitcher />);
    await userEvent.click(screen.getByRole("button", { name: /Switch farm:/ }));
    expect(
      screen.getByRole("dialog", { name: "Choose farm workspace" }),
    ).toBeInTheDocument();
    expect(screen.getByRole("button", { pressed: true })).toHaveTextContent(
      farms[0].name,
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: "Find a farm" }),
      "West",
    );
    expect(
      screen.getByRole("button", { name: /West Field/ }),
    ).toBeInTheDocument();
    expect(screen.queryByText("Current workspace")).not.toBeInTheDocument();
  });
  it("switches the farm and closes the chooser", async () => {
    render(<FarmSwitcher />);
    await userEvent.click(screen.getByRole("button", { name: /Switch farm:/ }));
    await userEvent.click(screen.getByRole("button", { name: /West Field/ }));
    expect(useWorkspace.getState().farm?.id).toBe("two");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: "Switch farm: West Field" }),
    ).toHaveFocus();
  });
  it("Escape closes the chooser and returns focus to its trigger", async () => {
    render(<FarmSwitcher />);
    await userEvent.click(screen.getByRole("button", { name: /Switch farm:/ }));
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(screen.getByRole("button", { name: /Switch farm:/ })).toHaveFocus();
  });
});
