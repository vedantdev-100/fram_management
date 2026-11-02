import { uuid } from "@/lib/uuid";
import { seed, demoFarm, demoUser } from "./data";
import type { Row, Page } from "@/types";
import { ApiError } from "@/api/client";
let database: Record<string, Row[]> | null = null;
function db() {
  if (!database) {
    try {
      database = JSON.parse(sessionStorage.getItem("fieldwork-demo") || "null");
    } catch {
      /* empty preview */
    }
    database ??= structuredClone(seed);
  }
  return database;
}
function save() {
  sessionStorage.setItem("fieldwork-demo", JSON.stringify(db()));
}
const row = (body: Record<string, unknown>): Row => ({
  id: uuid(),
  farm: demoFarm.id,
  version: 1,
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString(),
  ...body,
});
export async function demoRequest<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  await new Promise((r) => setTimeout(r, 120));
  if (options.signal?.aborted) throw new DOMException("Aborted", "AbortError");
  const url = new URL(
    path.startsWith("http") ? path : "http://preview/api/v1/" + path,
  );
  const parts = url.pathname
    .replace(/^.*\/api\/v1\//, "")
    .split("/")
    .filter(Boolean);
  const method = options.method || "GET";
  let body: Record<string, unknown> = {};
  if (typeof options.body === "string") body = JSON.parse(options.body);
  if (options.body instanceof FormData)
    for (const [k, v] of options.body)
      body[k] = typeof v === "string" ? v : v.name;
  if (parts.join("/") === "auth/me") return structuredClone(demoUser) as T;
  if (parts.length === 1 && parts[0] === "farms") {
    if (method === "GET") return (db().farms || [demoFarm]) as T;
    const f = row({ ...body, currency_code: "INR", timezone: "Asia/Kolkata" });
    db().farms.push(f);
    save();
    return f as T;
  }
  if (parts[0] !== "farms") return {} as T;
  const resource = parts[2];
  if (resource === "reports") {
    const name = parts[3];
    let result: unknown = [];
    if (name === "stock-status") result = db()["stock-items"];
    if (name === "cash-timeline")
      result = db().accounts.map((a) => ({
        account: a.id,
        name: a.name,
        balance:
          Number(a.opening_balance) +
          db()
            .entries.filter((e) => e.account === a.id)
            .reduce(
              (s, e) => s + (e.direction === "in" ? 1 : -1) * Number(e.amount),
              0,
            ),
      }));
    if (name === "plan-versus-actual") result = db().events;
    if (name === "crop-cycle-profit-loss")
      result = db()["crop-cycles"].map((c, i) => ({
        crop_cycle: c.id,
        name: c.name,
        cost: String(18000 + i * 5200),
        revenue: i === 2 ? "42000" : "0",
        margin: String((i === 2 ? 42000 : 0) - (18000 + i * 5200)),
      }));
    if (name === "operation-cost")
      result = [
        { cost_nature: "Machine use", amount: "1800" },
        { cost_nature: "Labour", amount: "550" },
      ];
    if (name === "utilisation")
      result = [{ machine_id: db().assets[4].id, hours: "12" }];
    return result as T;
  }
  if (resource === "commands") {
    const key = parts[3];
    if (["create_event", "record_observation", "adjust_stock"].includes(key)) {
      const e = row({
        ...body,
        title: body.title || "New farm operation",
        status:
          key === "record_observation"
            ? "done"
            : body.draft
              ? "draft"
              : "planned",
        actual_cost_total: "0",
        planned_cost_total: "0",
      });
      db().events.unshift(e);
      for (const line of (body.lines as Record<string, unknown>[]) || [])
        db()["sub-events"].push(
          row({ ...line, event: e.id, status: "planned" }),
        );
      save();
      return e as T;
    }
    if (
      [
        "plan_event",
        "start_event",
        "submit_event",
        "confirm_event",
        "cancel_event",
        "reschedule_event",
      ].includes(key)
    ) {
      const e = db().events.find((r) => r.id === body.event_id);
      if (!e) throw new ApiError(404, "Select a preview event.");
      if (
        body.version !== undefined &&
        Number(body.version) !== Number(e.version)
      )
        throw new ApiError(409, "The preview event changed. Refresh it first.");
      const transitions: Record<string, string> = {
        plan_event: "planned",
        start_event: "in_progress",
        confirm_event: "done",
        cancel_event: "cancelled",
      };
      if (transitions[key]) e.status = transitions[key];
      if (key === "submit_event") e.submitted_at = new Date().toISOString();
      if (key === "reschedule_event") {
        e.planned_start = body.start;
        e.planned_end = body.end;
      }
      e.version = Number(e.version || 1) + 1;
      save();
      return e as T;
    }
    if (key === "create_crop_cycle") {
      const cycle = row({ ...(body.cycle as object), status: "planned" });
      db()["crop-cycles"].push(cycle);
      save();
      return cycle as T;
    }
    if (key === "mark_notification_read") {
      const n = db().notifications.find((n) => n.id === body.notification_id);
      if (n) n.read_at = new Date().toISOString();
      save();
      return n as T;
    }
    if (key === "run_reconciliation")
      return {
        status: "balanced",
        difference: "0",
        cash_spent_on_assets: "3000",
        change_in_register_value: "2460",
        cost_recognised: "540",
        preview_only: true,
      } as T;
    throw new ApiError(
      400,
      "This action needs the live Django backend. Preview mode supports browsing, basic records and the work lifecycle.",
    );
  }
  if (resource === "files" || resource === "boundaries" || resource === "sync")
    throw new ApiError(
      400,
      "Connect your Django backend to use uploads, spatial validation and offline sync.",
    );
  const rows = db()[resource] ?? (db()[resource] = []);
  if (method === "GET") {
    if (parts[3]) {
      const found = rows.find((r) => r.id === parts[3]);
      if (!found) throw new ApiError(404, "Preview record not found.");
      return structuredClone(found) as T;
    }
    let results = rows.filter(
      (r) => r.farm === null || r.farm === undefined || r.farm === parts[1],
    );
    for (const [k, v] of url.searchParams)
      if (
        [
          "event",
          "asset",
          "status",
          "block",
          "crop_cycle",
          "stock_item",
          "season",
        ].includes(k)
      )
        results = results.filter((r) => String(r[k]) === v);
    return structuredClone({
      results,
      next: null,
      previous: null,
    } satisfies Page) as T;
  }
  if (method === "POST") {
    const record = row(body);
    rows.unshift(record);
    save();
    return record as T;
  }
  if (method === "PATCH") {
    const old = rows.find((r) => r.id === parts[3]);
    if (!old) throw new ApiError(404, "Preview record not found.");
    Object.assign(old, body, { version: Number(old.version || 1) + 1 });
    save();
    return old as T;
  }
  throw new ApiError(405, "Unsupported preview action.");
}
