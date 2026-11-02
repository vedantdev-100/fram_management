import { describe, it, expect } from "vitest";
import { cleanValues, initialValues } from "./forms";
import type { Field } from "@/types";
describe("API form values", () => {
  it("preserves decimal precision as a string and sends integer fields as numbers", () => {
    const f: Field[] = [
      { name: "amount", label: "Amount", type: "number", step: "any" },
      { name: "version", label: "Version", type: "number", step: "1" },
    ];
    expect(cleanValues(f, { amount: "123456789.1234", version: "4" })).toEqual({
      amount: "123456789.1234",
      version: 4,
    });
  });
  it("normalises nested execution timestamps and preserves quantity corrections", () => {
    const f: Field[] = [
      {
        name: "lines",
        label: "Lines",
        type: "array",
        fields: [
          { name: "start", label: "Start", type: "datetime-local" },
          { name: "quantity", label: "Quantity", type: "number" },
        ],
      },
    ];
    const value = cleanValues(f, {
      lines: [{ start: "2026-11-01T10:30", quantity: "18.1250" }],
    });
    expect((value.lines as Record<string, unknown>[])[0]).toEqual({
      start: new Date("2026-11-01T10:30").toISOString(),
      quantity: "18.1250",
    });
  });
  it("omits unfilled optional fields instead of replacing backend defaults", () => {
    expect(
      cleanValues([{ name: "notes", label: "Notes", type: "text" }], {
        notes: "",
      }),
    ).toEqual({});
  });
  it("initialises defaults inside array rows", () => {
    const f: Field[] = [
      {
        name: "lines",
        label: "Lines",
        type: "array",
        default: [{}],
        fields: [
          {
            name: "kind",
            label: "Kind",
            type: "text",
            default: "consume_stock",
          },
        ],
      },
    ];
    expect(initialValues(f)).toEqual({ lines: [{ kind: "consume_stock" }] });
  });
  it("rejects malformed structured values before a request is sent", () => {
    expect(() =>
      cleanValues([{ name: "geometry", label: "Boundary", type: "json" }], {
        geometry: "{invalid",
      }),
    ).toThrow();
  });
});
it("clears nullable relationships and notes explicitly when editing", () => {
  const fields: Field[] = [
    {
      name: "product",
      label: "Product",
      type: "reference",
      resource: "products",
      nullable: true,
    },
    { name: "notes", label: "Notes", type: "textarea" },
  ];
  expect(cleanValues(fields, { product: "", notes: "" }, true)).toEqual({
    product: null,
    notes: "",
  });
});
