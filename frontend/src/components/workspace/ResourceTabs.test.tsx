import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import type { ResourceDefinition } from "@/types";
import { ResourceTabs } from "./ResourceTabs";
afterEach(cleanup);
const resources: ResourceDefinition[] = ["events", "observations", "types"].map(
  (key) => ({
    key,
    title: key,
    model: key,
    editable: false,
    columns: [],
    fields: [],
    relations: {},
  }),
);
function Harness() {
  const [active, setActive] = useState("events");
  return (
    <ResourceTabs
      id="test-tabs"
      title="Farm work"
      resources={resources}
      active={active}
      onSelect={setActive}
    />
  );
}
describe("resource tab navigation", () => {
  it("changes selection with arrow keys and wraps while keeping focus", async () => {
    render(<Harness />);
    const first = screen.getByRole("tab", { name: "events" });
    expect(first).toHaveAttribute("aria-selected", "true");
    await userEvent.tab();
    await userEvent.keyboard("{ArrowRight}");
    expect(screen.getByRole("tab", { name: "observations" })).toHaveAttribute(
      "aria-selected",
      "true",
    );
    expect(screen.getByRole("tab", { name: "observations" })).toHaveFocus();
    await userEvent.keyboard("{End}{ArrowRight}");
    expect(first).toHaveFocus();
    expect(first).toHaveAttribute("aria-selected", "true");
    await userEvent.keyboard("{ArrowLeft}{Home}");
    expect(first).toHaveFocus();
  });
  it("supports pointer selection and a single tab stop with a panel association", async () => {
    render(<Harness />);
    const target = screen.getByRole("tab", { name: "types" });
    await userEvent.click(target);
    expect(target).toHaveAttribute("aria-selected", "true");
    expect(target).toHaveAttribute("tabindex", "0");
    expect(target).toHaveAttribute("aria-controls", "test-tabs-panel");
    expect(screen.getByRole("tab", { name: "events" })).toHaveAttribute(
      "tabindex",
      "-1",
    );
  });
});
