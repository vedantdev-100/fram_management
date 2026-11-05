import { afterEach, describe, expect, it } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter } from "react-router-dom";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { setupGuides } from "./guides";
import { SetupGuide } from "../layout/SetupGuide";
afterEach(cleanup);
describe("farm setup navigation", () => {
  it("covers every page in Your farm and Planning & records", () => {
    expect(Object.keys(setupGuides).sort()).toEqual(
      [
        "/",
        "/land",
        "/events",
        "/assets",
        "/ledger",
        "/reports",
        "/crop-science",
        "/scheduling",
        "/workbench",
        "/costing",
        "/compliance",
        "/files",
      ].sort(),
    );
  });
  it("links only to registered pages, resources and commands", () => {
    const contract = JSON.parse(
      readFileSync(resolve("docs/backend-contract.json"), "utf8"),
    );
    const pages = new Set([...Object.keys(setupGuides), "/catalogue"]);
    for (const guide of Object.values(setupGuides)) {
      expect(guide.steps.length).toBeLessThanOrEqual(5);
      for (const step of guide.steps) {
        const url = new URL(step.href, "https://farm.test");
        expect(pages.has(url.pathname)).toBe(true);
        if (url.searchParams.has("tab"))
          expect(contract.resources).toHaveProperty(
            url.searchParams.get("tab")!,
          );
        if (url.searchParams.has("action"))
          expect(contract.commands).toContain(url.searchParams.get("action"));
      }
    }
  });
  it("shows an ordered flow with optional steps and collapses without navigating", async () => {
    render(
      <MemoryRouter>
        <SetupGuide pathname="/assets" />
      </MemoryRouter>,
    );
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    await userEvent.click(screen.getByRole("button", { name: /Show guide/ }));
    expect(
      screen.getByRole("list", { name: "Recommended setup order" }).children,
    ).toHaveLength(5);
    expect(screen.getByText("Optional")).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: /Create the asset/ }),
    ).toHaveAttribute("href", "/assets?tab=assets");
    const toggle = screen.getByRole("button", { name: /From a farm resource/ });
    await userEvent.click(toggle);
    expect(toggle).toHaveAttribute("aria-expanded", "false");
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
    const region = document.getElementById(
      toggle.getAttribute("aria-controls")!,
    )!;
    expect(region).toHaveAttribute("inert");
    expect(region).toHaveAttribute("aria-hidden", "true");
    // Content stays mounted so closing can animate; it becomes usable again on reopening.
    expect(region.querySelectorAll("a")).toHaveLength(5);
    await userEvent.click(toggle);
    expect(region).not.toHaveAttribute("inert");
    expect(
      screen.getByRole("list", { name: "Recommended setup order" }),
    ).toBeInTheDocument();
  });
});
