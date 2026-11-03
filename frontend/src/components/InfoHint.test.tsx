import { afterEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { InfoHint } from "./InfoHint";
import { Fields } from "./forms/Fields";
import { fieldHelp } from "@/lib/fieldHelp";
afterEach(cleanup);
describe("field help", () => {
  it("opens on keyboard activation, closes with Escape, and never submits", async () => {
    const submit = vi.fn((e) => e.preventDefault());
    render(
      <form onSubmit={submit}>
        <InfoHint
          label="Reorder level"
          description="Check stock at 10 kg or less."
        />
      </form>,
    );
    const button = screen.getByRole("button", { name: "About Reorder level" });
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(button).toHaveAttribute("aria-expanded", "true");
    expect(screen.getByRole("note")).toHaveTextContent("10 kg");
    expect(submit).not.toHaveBeenCalled();
    await userEvent.keyboard("{Escape}");
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
    expect(button).toHaveFocus();
  });
  it("closes when clicking elsewhere", async () => {
    render(
      <>
        <InfoHint label="Area" description="Enter the area." />
        <button>Outside</button>
      </>,
    );
    await userEvent.click(screen.getByRole("button", { name: "About Area" }));
    await userEvent.click(screen.getByRole("button", { name: "Outside" }));
    expect(screen.queryByRole("note")).not.toBeInTheDocument();
  });
  it("keeps help separate from checkbox and text labels", async () => {
    const change = vi.fn();
    render(
      <Fields
        fields={[
          { name: "reorder_level", label: "Reorder level", type: "number" },
          { name: "is_paid", label: "Paid", type: "boolean" },
        ]}
        values={{}}
        onChange={change}
      />,
    );
    expect(screen.getByLabelText("Reorder level")).toHaveAttribute(
      "type",
      "number",
    );
    await userEvent.click(screen.getByRole("button", { name: "About Paid" }));
    expect(screen.getByRole("checkbox", { name: "Paid" })).not.toBeChecked();
    expect(change).not.toHaveBeenCalled();
  });
  it("explains stock terms and gives explicit feature help priority", () => {
    expect(
      fieldHelp({
        name: "valuation_method",
        label: "Valuation",
        type: "select",
      }),
    ).toContain("FIFO");
    expect(
      fieldHelp({ name: "reorder_level", label: "Reorder", type: "number" }),
    ).toContain("does not automatically");
    expect(
      fieldHelp({
        name: "amount",
        label: "Amount",
        type: "number",
        help: "Specific rule",
      }),
    ).toBe("Specific rule");
  });
});
