import { OfflineDraftsPanel } from "@/offline/OfflineDraftsPanel";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { RefreshCw, CloudDownload } from "lucide-react";
import { PageHeader, Button, ErrorBox } from "@/components/ui";
import { useWorkspace } from "@/stores/workspace";
import { syncApi } from "../api";
import { useSyncState } from "../hooks/useSync";
import { BatchUpload } from "../components/BatchUpload";
import { refreshFarmQueries } from "@/api/queryClient";
export default function SyncPage() {
  const farm = useWorkspace((s) => s.farm)!;
  const cursor = useSyncState((s) => s.cursors[farm.id]);
  const [count, setCount] = useState<number | null>(null);
  const mutation = useMutation({
    mutationFn: (fresh: boolean) =>
      syncApi.changes(farm.id, fresh ? undefined : cursor),
    onSuccess: async (data) => {
      useSyncState.getState().setCursor(farm.id, data.cursor);
      setCount(data.count);
      await refreshFarmQueries();
    },
  });
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="KEEP RECORDS TOGETHER"
        title="Offline sync"
        description="Review local offline drafts, check server changes and submit saved event batches."
      />
      <OfflineDraftsPanel />
      <div className="panel p-6 mb-6">
        <span className="empty-icon mb-4">
          <CloudDownload size={24} />
        </span>
        <h2 className="section-heading">Check farm changes</h2>
        <p className="form-intro">
          {cursor
            ? "A checkpoint is saved for this farm. Fetch only changes since that checkpoint."
            : "Start with an initial snapshot. A checkpoint will be stored for the next check."}
        </p>
        <div className="flex flex-wrap gap-3">
          <Button
            loading={mutation.isPending}
            onClick={() => mutation.mutate(false)}
          >
            <RefreshCw size={16} />
            Check changes
          </Button>
          {cursor && (
            <Button variant="secondary" onClick={() => mutation.mutate(true)}>
              Start a fresh snapshot
            </Button>
          )}
        </div>
        {count !== null && (
          <p className="success-note">
            {count} changed records received. Workspace queries refreshed.
          </p>
        )}
        {mutation.error && <ErrorBox error={mutation.error} />}
      </div>
      <BatchUpload />
    </div>
  );
}
