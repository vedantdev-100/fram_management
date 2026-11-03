import { create } from "zustand";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
export interface OfflineDraft {
  id: string;
  owner: string;
  farm: string;
  mode: "live" | "demo";
  label: string;
  kind: "record" | "command";
  key: string;
  recordId?: string;
  version?: number;
  values: Record<string, unknown>;
  route: string;
  updatedAt: string;
  reason: "disconnected" | "connection_failed";
}
export const DRAFT_KEY = "fieldwork-offline-drafts-v1";
function load(): OfflineDraft[] {
  try {
    const value = JSON.parse(localStorage.getItem(DRAFT_KEY) || "[]");
    return Array.isArray(value) ? value.filter(validDraft) : [];
  } catch {
    return [];
  }
}
function validDraft(v: unknown): v is OfflineDraft {
  if (!v || typeof v !== "object") return false;
  const d = v as OfflineDraft;
  return (
    typeof d.id === "string" &&
    typeof d.owner === "string" &&
    typeof d.farm === "string" &&
    ["live", "demo"].includes(d.mode) &&
    ["record", "command"].includes(d.kind) &&
    typeof d.key === "string" &&
    (d.recordId === undefined || typeof d.recordId === "string") &&
    (d.version === undefined ||
      (Number.isSafeInteger(d.version) && d.version >= 0)) &&
    typeof d.label === "string" &&
    typeof d.route === "string" &&
    d.route.startsWith("/") &&
    !d.route.startsWith("//") &&
    !!d.values &&
    typeof d.values === "object" &&
    !Array.isArray(d.values) &&
    typeof d.updatedAt === "string" &&
    ["disconnected", "connection_failed"].includes(d.reason)
  );
}
export const useDrafts = create<{ drafts: OfflineDraft[] }>(() => ({
  drafts: load(),
}));
export function ownedDrafts() {
  const session = useSession.getState();
  const farm = useWorkspace.getState().farm;
  return useDrafts
    .getState()
    .drafts.filter(
      (d) =>
        d.owner === session.user?.id &&
        d.farm === farm?.id &&
        d.mode === session.mode,
    );
}
function persist(drafts: OfflineDraft[]) {
  // Persist first: never report a saved draft if storage is blocked or full.
  localStorage.setItem(DRAFT_KEY, JSON.stringify(drafts));
  useDrafts.setState({ drafts });
}
export function saveDraft(draft: OfflineDraft) {
  if (!validDraft(draft))
    throw new Error("The local draft could not be prepared.");
  const session = useSession.getState();
  if (
    draft.owner !== session.user?.id ||
    draft.farm !== useWorkspace.getState().farm?.id ||
    draft.mode !== session.mode
  )
    throw new Error(
      "The active account or farm changed. Reopen the form before saving.",
    );
  const snapshot = JSON.parse(JSON.stringify(draft)) as OfflineDraft;
  persist([
    snapshot,
    ...useDrafts.getState().drafts.filter((d) => d.id !== draft.id),
  ]);
}
export function removeDraft(id: string) {
  if (!ownedDrafts().some((d) => d.id === id)) return;
  persist(useDrafts.getState().drafts.filter((d) => d.id !== id));
}
export function restorableDraft(
  kind: OfflineDraft["kind"],
  key: string,
  recordId?: string,
) {
  const id = new URLSearchParams(window.location.search).get("draft");
  return ownedDrafts().find(
    (d) =>
      d.id === id &&
      d.kind === kind &&
      d.key === key &&
      d.recordId === recordId,
  );
}
export function resumePath(draft: OfflineDraft) {
  const url = new URL(draft.route, window.location.origin);
  if (
    url.origin !== window.location.origin ||
    !/^\/[a-z-]*$/.test(url.pathname)
  )
    throw new Error("This draft has an invalid return page.");
  url.searchParams.set("draft", draft.id);
  if (draft.kind === "record") {
    url.searchParams.set("tab", draft.key);
    url.searchParams.delete("action");
    if (draft.recordId) url.searchParams.set("record", draft.recordId);
    else url.searchParams.delete("record");
  } else {
    url.searchParams.set("action", draft.key);
    url.searchParams.delete("record");
  }
  return url.pathname + url.search;
}
export function exportDrafts(drafts: OfflineDraft[]) {
  const session = useSession.getState();
  const farm = useWorkspace.getState().farm;
  const selected = drafts.filter(
    (d) =>
      validDraft(d) &&
      d.owner === session.user?.id &&
      d.farm === farm?.id &&
      d.mode === session.mode,
  );
  if (!selected.length)
    throw new Error("No drafts are selected for this account and farm.");
  const content = JSON.stringify(
    {
      format: "fieldwork.offline-drafts.v1",
      exportedAt: new Date().toISOString(),
      drafts: selected,
    },
    null,
    2,
  );
  const url = URL.createObjectURL(
    new Blob([content], { type: "application/json" }),
  );
  const link = document.createElement("a");
  link.href = url;
  link.download = `fieldwork-offline-drafts-${new Date().toISOString().slice(0, 10)}.json`;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
export function importDrafts(value: unknown) {
  const data = value as { format?: string; drafts?: unknown[] };
  if (
    data?.format !== "fieldwork.offline-drafts.v1" ||
    !Array.isArray(data.drafts) ||
    !data.drafts.length ||
    data.drafts.length > 100
  )
    throw new Error(
      "Choose a Fieldwork offline-drafts export containing 1–100 drafts.",
    );
  const session = useSession.getState();
  const farm = useWorkspace.getState().farm;
  const incoming: OfflineDraft[] = [];
  for (const d of data.drafts) {
    if (
      !validDraft(d) ||
      d.owner !== session.user?.id ||
      d.farm !== farm?.id ||
      d.mode !== session.mode
    )
      throw new Error(
        "Every imported draft must belong to the signed-in account, current farm and workspace mode.",
      );
    resumePath(d);
    incoming.push(d);
  }
  const merged = new Map(useDrafts.getState().drafts.map((d) => [d.id, d]));
  for (const draft of incoming) {
    const existing = merged.get(draft.id);
    if (
      existing &&
      (existing.owner !== draft.owner ||
        existing.farm !== draft.farm ||
        existing.mode !== draft.mode)
    )
      throw new Error("A draft identifier conflicts with another local draft.");
    if (!existing || draft.updatedAt > existing.updatedAt)
      merged.set(draft.id, draft);
  }
  persist([...merged.values()]);
  return incoming.length;
}
