import { beforeEach, afterEach, describe, expect, it, vi } from "vitest";
import {
  act,
  cleanup,
  render,
  renderHook,
  screen,
  waitFor,
} from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { ApiError } from "@/api/client";
import {
  DRAFT_KEY,
  exportDrafts,
  importDrafts,
  ownedDrafts,
  removeDraft,
  restorableDraft,
  resumePath,
  saveDraft,
  useDrafts,
} from "./drafts";
import type { OfflineDraft } from "./drafts";
import { useOfflineForm } from "./useOfflineForm";
import { RecordForm } from "@/components/forms/RecordForm";
import type { ResourceDefinition } from "@/types";
const resource: ResourceDefinition = {
  key: "blocks",
  title: "Blocks",
  model: "land.Block",
  editable: true,
  columns: ["name"],
  fields: [{ name: "name", label: "Name", type: "text", required: true }],
  relations: {},
};
const context = { owner: "user-a", farm: "farm-a", mode: "live" as const };
const draft = (extra: Partial<OfflineDraft> = {}): OfflineDraft => ({
  ...context,
  id: "draft-a",
  label: "Blocks",
  kind: "record",
  key: "blocks",
  values: { name: "North block" },
  route: "/land?tab=blocks",
  updatedAt: "2026-11-03T10:00:00.000Z",
  reason: "disconnected",
  ...extra,
});
beforeEach(() => {
  localStorage.clear();
  useDrafts.setState({ drafts: [] });
  useSession.setState({
    user: {
      id: "user-a",
      email: "test@example.com",
      full_name: "Test",
      memberships: [],
    },
    mode: "live",
  });
  useWorkspace.setState({
    farm: {
      id: "farm-a",
      name: "Farm A",
      slug: "farm-a",
      currency_code: "INR",
      timezone: "Asia/Kolkata",
    },
  });
  window.history.replaceState({}, "", "/land?tab=blocks");
  vi.spyOn(navigator, "onLine", "get").mockReturnValue(true);
});
afterEach(() => {
  cleanup();
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
  vi.useRealTimers();
});
describe("offline draft isolation and persistence", () => {
  it("persists form values and restores only the matching owner, farm, mode and form", () => {
    saveDraft(draft());
    expect(JSON.parse(localStorage.getItem(DRAFT_KEY)!)[0].values.name).toBe(
      "North block",
    );
    window.history.replaceState({}, "", "/land?tab=blocks&draft=draft-a");
    expect(restorableDraft("record", "blocks")?.id).toBe("draft-a");
    expect(restorableDraft("record", "accounts")).toBeUndefined();
    useSession.setState({ mode: "demo" });
    expect(ownedDrafts()).toHaveLength(0);
    useSession.setState({
      mode: "live",
      user: {
        id: "user-b",
        email: "b@example.com",
        full_name: "B",
        memberships: [],
      },
    });
    expect(ownedDrafts()).toHaveLength(0);
    removeDraft("draft-a");
    expect(useDrafts.getState().drafts).toHaveLength(1);
  });
  it("never reports an in-memory save when storage is full", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    expect(() => saveDraft(draft())).toThrow("Storage full");
    expect(useDrafts.getState().drafts).toHaveLength(0);
  });
  it("downloads an owned JSON backup and releases the object URL", () => {
    vi.useFakeTimers();
    const NativeURL = URL;
    const create = vi.fn((_blob: Blob) => "blob:local-backup");
    const revoke = vi.fn();
    vi.stubGlobal(
      "URL",
      class extends NativeURL {
        static createObjectURL = create;
        static revokeObjectURL = revoke;
      },
    );
    const click = vi
      .spyOn(HTMLAnchorElement.prototype, "click")
      .mockImplementation(() => {});
    saveDraft(draft());
    exportDrafts(ownedDrafts());
    expect(create).toHaveBeenCalledWith(expect.any(Blob));
    expect(create.mock.calls[0][0].size).toBeGreaterThan(0);
    expect(click).toHaveBeenCalledOnce();
    vi.runAllTimers();
    expect(revoke).toHaveBeenCalledWith("blob:local-backup");
  });
  it("retains original edit versions and request UUIDs in a backup", () => {
    saveDraft(
      draft({
        kind: "command",
        key: "create_event",
        values: { client_uuid: "original-uuid", title: "Work" },
      }),
    );
    expect(ownedDrafts()[0].values.client_uuid).toBe("original-uuid");
    const edit = draft({ id: "edit-a", recordId: "block-a", version: 3 });
    saveDraft(edit);
    expect(resumePath(edit)).toContain("record=block-a");
    expect(resumePath(edit)).toContain("draft=edit-a");
    expect(ownedDrafts().find((d) => d.id === "edit-a")?.version).toBe(3);
  });
  it("imports atomically for the same context and rejects another farm", () => {
    expect(() =>
      importDrafts({
        format: "fieldwork.offline-drafts.v1",
        drafts: [draft(), draft({ id: "foreign", farm: "other-farm" })],
      }),
    ).toThrow(/current farm/);
    expect(ownedDrafts()).toHaveLength(0);
    expect(
      importDrafts({
        format: "fieldwork.offline-drafts.v1",
        drafts: [draft()],
      }),
    ).toBe(1);
    expect(ownedDrafts()).toHaveLength(1);
    expect(() => resumePath(draft({ route: "//untrusted.example" }))).toThrow();
  });
});
describe("offline form behavior", () => {
  it("does not save an online form or a validation/permission failure locally", () => {
    const { rerender } = renderHook(
      ({ error }) =>
        useOfflineForm({
          kind: "record",
          key: "blocks",
          label: "Blocks",
          values: { name: "Block" },
          error,
        }),
      { initialProps: { error: new ApiError(400, "Invalid") } },
    );
    expect(ownedDrafts()).toHaveLength(0);
    rerender({ error: new ApiError(403, "Denied") });
    expect(ownedDrafts()).toHaveLength(0);
  });
  it("backs up a failed connection without claiming server success", () => {
    renderHook(() =>
      useOfflineForm({
        kind: "record",
        key: "blocks",
        label: "Blocks",
        values: { name: "Block" },
        error: new ApiError(0, "Connection failed"),
      }),
    );
    expect(ownedDrafts()[0].reason).toBe("connection_failed");
  });
  it("autosaves offline edits and never submits on reconnect", async () => {
    const onLine = vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <RecordForm
        resource={resource}
        onSave={save}
        onClose={() => {}}
        pending={false}
        error={null}
      />,
    );
    await userEvent.type(
      screen.getByRole("textbox", { name: /^Name/ }),
      "Brinjal block",
    );
    await waitFor(() =>
      expect(ownedDrafts()[0].values.name).toBe("Brinjal block"),
    );
    await userEvent.click(screen.getByRole("button", { name: "Save offline" }));
    expect(save).not.toHaveBeenCalled();
    onLine.mockReturnValue(true);
    act(() => window.dispatchEvent(new Event("online")));
    expect(save).not.toHaveBeenCalled();
    await userEvent.click(
      screen.getByRole("button", { name: "Create record" }),
    );
    await waitFor(() =>
      expect(save).toHaveBeenCalledWith({ name: "Brinjal block" }),
    );
    await waitFor(() => expect(ownedDrafts()).toHaveLength(0));
  });
  it("resumes an existing record with its original version rather than the fetched latest version", async () => {
    saveDraft(draft({ recordId: "block-a", version: 3 }));
    window.history.replaceState(
      {},
      "",
      "/land?tab=blocks&record=block-a&draft=draft-a",
    );
    const save = vi.fn().mockResolvedValue(undefined);
    render(
      <RecordForm
        resource={resource}
        record={{ id: "block-a", name: "Server latest", version: 6 }}
        onSave={save}
        onClose={() => {}}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByRole("textbox", { name: /^Name/ })).toHaveValue(
      "North block",
    );
    await userEvent.click(screen.getByRole("button", { name: "Save changes" }));
    expect(save).toHaveBeenCalledWith({ name: "North block", version: 3 });
  });
  it("shows quota failures instead of saying the data was saved", () => {
    vi.spyOn(navigator, "onLine", "get").mockReturnValue(false);
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("Storage full");
    });
    render(
      <RecordForm
        resource={resource}
        onSave={vi.fn()}
        onClose={() => {}}
        pending={false}
        error={null}
      />,
    );
    expect(screen.getByRole("alert")).toHaveTextContent("Storage full");
    expect(screen.queryByText(/Local backup saved/)).not.toBeInTheDocument();
  });
});
