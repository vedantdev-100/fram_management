import { describe, it, expect } from "vitest";
import { commands } from "./commands";
import { initialValues, cleanValues } from "@/lib/forms";
import type { Field } from "@/types";
describe("work command contracts", () => {
  const plan = commands.find((c) => c.key === "create_event")!;
  it("defaults to a nonempty planning window when the dialog opens", () => {
    const values = initialValues(plan.fields);
    expect(
      new Date(String(values.planned_end)).getTime() -
        new Date(String(values.planned_start)).getTime(),
    ).toBeGreaterThan(50 * 60000);
  });
  it("reuses the form client UUID so a retry cannot create a second operation", () => {
    const values = {
      client_uuid: "00000000-0000-4000-8000-000000000001",
      lines: [],
    };
    expect(plan.build!(values).client_uuid).toBe(values.client_uuid);
    expect(plan.build!(values).client_uuid).toBe(values.client_uuid);
  });
  it("exposes acquisition price and both cash-account references in the line editor", () => {
    const lines = plan.fields.find((f) => f.name === "lines")!.fields!;
    expect(lines.find((f) => f.name === "unit_price")?.required).toBe(true);
    expect(lines.find((f) => f.name === "account_id")?.resource).toBe(
      "accounts",
    );
    expect(lines.find((f) => f.name === "ledger_category_id")?.resource).toBe(
      "ledger-categories",
    );
  });
  it("does not send hidden payment fields after changing to stock consumption", () => {
    const lines = plan.fields.find((f) => f.name === "lines")!.fields!;
    const cleaned = cleanValues(lines, {
      kind: "consume_stock",
      planned_qty: "18",
      amount: "3000",
      account_id: "old-account",
      unit_price: "30",
    });
    expect(cleaned).toEqual({ kind: "consume_stock", planned_qty: "18" });
  });
  it("keeps geometry input available for boundary-independent work targets", () => {
    const f: Field | undefined = plan.fields.find((f) => f.name === "targets");
    expect(f?.required).toBe(false);
  });
});
