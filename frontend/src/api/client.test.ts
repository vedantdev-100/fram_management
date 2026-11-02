import { describe, it, expect, vi, beforeEach } from "vitest";
import { apiRequest, ApiError, API_BASE } from "./client";
import { useSession } from "@/stores/session";
const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json" },
  });
beforeEach(() => {
  useSession.getState().clear();
  useSession.getState().setTokens("old-access", "refresh-1");
});
describe("authenticated transport", () => {
  it("never sends a bearer token to an external pagination URL", async () => {
    const fetcher = vi.fn();
    vi.stubGlobal("fetch", fetcher);
    await expect(
      apiRequest("https://other.example/api/v1/units/"),
    ).rejects.toBeInstanceOf(ApiError);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("refreshes rotated tokens once for concurrent unauthorised requests", async () => {
    let refreshes = 0;
    const fetcher = vi.fn(
      async (input: RequestInfo | URL, init?: RequestInit) => {
        if (String(input) === API_BASE + "/auth/refresh/") {
          refreshes++;
          await new Promise((r) => setTimeout(r, 5));
          return json({ access: "new-access", refresh: "refresh-2" });
        }
        return new Headers(init?.headers).get("Authorization") ===
          "Bearer new-access"
          ? json({ ok: true })
          : json({ detail: "expired" }, 401);
      },
    );
    vi.stubGlobal("fetch", fetcher);
    const results = await Promise.all([
      apiRequest<{ ok: boolean }>("farms/"),
      apiRequest<{ ok: boolean }>("auth/me/"),
    ]);
    expect(results.every((r) => r.ok)).toBe(true);
    expect(refreshes).toBe(1);
    expect(useSession.getState().refreshToken).toBe("refresh-2");
  });
  it("does not log a member out on a permission denial", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => json({ message: "Permission denied" }, 403)),
    );
    await expect(apiRequest("farms/x/entries/")).rejects.toMatchObject({
      status: 403,
    });
    expect(useSession.getState().refreshToken).toBe("refresh-1");
  });
  it("surfaces connection failures without substituting preview data", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new TypeError("offline")));
    await expect(apiRequest("farms/")).rejects.toMatchObject({ status: 0 });
    expect(useSession.getState().mode).toBe("live");
  });
});
it("does not restore a logged-out session when an earlier refresh finishes", async () => {
  let release: () => void = () => {};
  const pending = new Promise<void>((r) => {
    release = r;
  });
  vi.stubGlobal(
    "fetch",
    vi.fn(async (input: RequestInfo | URL) => {
      if (String(input) === API_BASE + "/auth/refresh/") {
        await pending;
        return json({ access: "late-access", refresh: "late-refresh" });
      }
      return json({ detail: "expired" }, 401);
    }),
  );
  const request = apiRequest("farms/");
  await vi.waitFor(() => expect(vi.mocked(fetch)).toHaveBeenCalledTimes(2));
  useSession.getState().clear();
  release();
  await expect(request).rejects.toMatchObject({ status: 401 });
  expect(useSession.getState().accessToken).toBeNull();
  expect(useSession.getState().refreshToken).toBeNull();
});
