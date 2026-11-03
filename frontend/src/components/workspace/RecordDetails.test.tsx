import { describe, it, expect, afterEach } from "vitest";
import { render, screen, cleanup } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { RecordDetails } from "./RecordDetails";
afterEach(cleanup);
describe("record detail hierarchy", () => {
  it("keeps names and notes intact and groups record metadata", async () => {
    render(
      <RecordDetails
        record={{
          id: "record-123",
          name: "pH test A",
          notes: "Keep lower CASE\nSecond line",
          version: 2,
        }}
      />,
    );
    expect(
      screen.getByRole("heading", { name: "Overview" }),
    ).toBeInTheDocument();
    expect(screen.getByText("pH test A")).toBeInTheDocument();
    expect(screen.getByText(/Keep lower CASE/)).toBeInTheDocument();
    const summary = screen.getByText("Record information");
    expect(summary.closest("details")).not.toHaveAttribute("open");
    await userEvent.click(summary);
    expect(summary.closest("details")).toHaveAttribute("open");
    expect(screen.getByText("record-123")).toBeVisible();
  });
  it("renders all nested values including audit changes and array rows", () => {
    render(
      <RecordDetails
        record={{
          id: "a",
          before: { quantity: "2" },
          after: { quantity: "3" },
          lines: [
            { material: "Urea", quantity: 5 },
            { material: "Compost", quantity: 8 },
          ],
        }}
      />,
    );
    expect(screen.getByRole("heading", { name: "Before" })).toBeInTheDocument();
    expect(screen.getByRole("heading", { name: "After" })).toBeInTheDocument();
    expect(
      screen.getByRole("columnheader", { name: "Material" }),
    ).toBeInTheDocument();
    expect(screen.getByText("Compost")).toBeInTheDocument();
    expect(screen.queryByText("Structured details")).not.toBeInTheDocument();
  });
  it("shows missing values without hiding false or zero", () => {
    render(
      <RecordDetails
        record={{ id: "b", enabled: false, quantity: 0, description: null }}
      />,
    );
    expect(screen.getByText("No")).toBeInTheDocument();
    expect(screen.getByText("0")).toBeInTheDocument();
    expect(screen.getByText("Not provided")).toBeInTheDocument();
  });
});
