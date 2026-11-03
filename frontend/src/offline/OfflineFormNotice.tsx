import { CloudOff, Save, Download } from "lucide-react";
import { Button } from "@/components/ui";
export function OfflineFormNotice({
  state,
}: {
  state: {
    disconnected: boolean;
    restored: boolean;
    savedAt: string;
    storageError: string;
    save: () => boolean;
    download: () => void;
  };
}) {
  if (!state.disconnected && !state.restored && !state.storageError)
    return null;
  return (
    <aside className="offline-form-note" aria-label="Offline draft status">
      <CloudOff size={19} />
      <div>
        <strong>
          {state.disconnected ? "Offline saving mode" : "Restored local draft"}
        </strong>
        <p>
          {state.disconnected
            ? "Local-draft mode keeps form values on this device instead of submitting them. Check the saved status below. Reconnect, review and submit when ready."
            : "Review these values before submitting. The original version and client UUID are retained where applicable."}
        </p>
        {state.savedAt && (
          <small role="status">
            Local backup saved · {new Date(state.savedAt).toLocaleTimeString()}
          </small>
        )}
        {state.storageError && (
          <p role="alert" className="field-error">
            {state.storageError}
          </p>
        )}
        <div className="flex flex-wrap gap-2">
          {state.disconnected && (
            <Button variant="secondary" onClick={() => state.save()}>
              <Save size={14} />
              Save offline now
            </Button>
          )}
          <Button variant="secondary" onClick={state.download}>
            <Download size={14} />
            Download this draft
          </Button>
        </div>
      </div>
    </aside>
  );
}
