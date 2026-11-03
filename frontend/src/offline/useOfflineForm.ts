import { useEffect, useRef, useState } from "react";
import { notify } from "@/stores/toasts";
import { ApiError } from "@/api/client";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { uuid } from "@/lib/uuid";
import {
  exportDrafts,
  removeDraft,
  restorableDraft,
  saveDraft,
} from "./drafts";
import type { OfflineDraft } from "./drafts";
export function useBrowserOffline() {
  const [offline, setOffline] = useState(!navigator.onLine);
  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);
  return offline;
}
export function useOfflineForm(options: {
  kind: OfflineDraft["kind"];
  key: string;
  label: string;
  values: Record<string, unknown>;
  error: unknown;
  recordId?: string;
  version?: number;
}) {
  const browserOffline = useBrowserOffline();
  const owner = useSession((s) => s.user?.id);
  const mode = useSession((s) => s.mode);
  const farm = useWorkspace((s) => s.farm?.id);
  const restored = useRef(
    restorableDraft(options.kind, options.key, options.recordId),
  );
  const id = useRef(restored.current?.id || uuid());
  const uncertain = useRef(restored.current?.reason === "connection_failed");
  if (options.error instanceof ApiError && options.error.status === 0)
    uncertain.current = true;
  const latest = useRef(options);
  latest.current = options;
  const disconnected =
    browserOffline ||
    (options.error instanceof ApiError && options.error.status === 0);
  const [savedAt, setSavedAt] = useState(restored.current?.updatedAt || "");
  const [storageError, setStorageError] = useState("");
  const snapshot = (): OfflineDraft => {
    if (!owner || !farm)
      throw new Error("Sign in and select a farm before using offline drafts.");
    const current = latest.current;
    return {
      id: id.current,
      owner,
      farm,
      mode,
      kind: current.kind,
      key: current.key,
      label: current.label,
      values: current.values,
      recordId: current.recordId,
      version: restored.current?.version ?? current.version,
      route: window.location.pathname + window.location.search,
      updatedAt: new Date().toISOString(),
      reason: uncertain.current ? "connection_failed" : "disconnected",
    };
  };
  const save = () => {
    if (!disconnected) return false;
    try {
      const draft = snapshot();
      saveDraft(draft);
      setSavedAt(draft.updatedAt);
      setStorageError("");
      return true;
    } catch (e) {
      setStorageError(
        (e as Error).message ||
          "Device storage is unavailable. Keep the form open and copy your data.",
      );
      return false;
    }
  };
  useEffect(() => {
    if (!disconnected) return;
    // Save on every disconnected edit rather than waiting for a submit/reconnect.
    save();
    // Values and connectivity are the triggers; savedAt/storageError are outputs.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [disconnected, options.values, owner, farm, mode]);
  return {
    browserOffline,
    disconnected,
    save,
    download: () => {
      try {
        exportDrafts([snapshot()]);
      } catch (e) {
        setStorageError((e as Error).message);
      }
    },
    savedAt,
    storageError,
    restored: !!restored.current,
    complete: () => {
      try {
        removeDraft(id.current);
      } catch {
        notify(
          "Saved on server, but the old local backup could not be removed. Delete it before retrying.",
          "error",
        );
        setStorageError(
          "The server saved this record, but the old local backup could not be removed. Delete it from Offline drafts; do not resubmit it.",
        );
      }
    },
  };
}
