import { it, expect, vi } from "vitest";
import { uuid } from "./uuid";
it("creates RFC 4122 IDs on HTTP preview hosts without randomUUID", () => {
  const getRandomValues = crypto.getRandomValues.bind(crypto);
  vi.stubGlobal("crypto", { getRandomValues });
  const ids = Array.from({ length: 20 }, () => uuid());
  expect(
    ids.every((id) =>
      /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(
        id,
      ),
    ),
  ).toBe(true);
  expect(new Set(ids).size).toBe(20);
  vi.unstubAllGlobals();
});
