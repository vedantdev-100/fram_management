import { useState } from "react";
import { Link } from "react-router-dom";
import { CloudOff, Download, Upload, ArrowUpRight, Trash2 } from "lucide-react";
import {
  useDrafts,
  exportDrafts,
  importDrafts,
  removeDraft,
  resumePath,
} from "./drafts";
import type { OfflineDraft } from "./drafts";
import { useBrowserOffline } from "./useOfflineForm";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { Button, Modal, ErrorBox } from "@/components/ui";
import { DetailTable } from "@/components/workspace/RecordDetails";
export function OfflineDraftsPanel({
  onNavigate,
}: {
  onNavigate?: () => void;
}) {
  const all = useDrafts((s) => s.drafts);
  const owner = useSession((s) => s.user?.id);
  const mode = useSession((s) => s.mode);
  const farm = useWorkspace((s) => s.farm?.id);
  const drafts = all.filter(
    (d) => d.owner === owner && d.farm === farm && d.mode === mode,
  );
  const offline = useBrowserOffline();
  const [review, setReview] = useState<OfflineDraft | null>(null);
  const [deleting, setDeleting] = useState<OfflineDraft | null>(null);
  const [error, setError] = useState<unknown>(null);
  const [notice, setNotice] = useState("");
  function safely(action: () => void) {
    try {
      setError(null);
      action();
    } catch (e) {
      setError(e);
    }
  }
  return (
    <section
      className="panel offline-drafts-panel"
      aria-label="Saved offline drafts"
    >
      <header>
        <div>
          <h2>
            <CloudOff size={20} />
            Saved offline drafts <span>{drafts.length}</span>
          </h2>
          <p>
            {offline
              ? "Offline saving mode is active."
              : "Online submissions go directly to the server."}{" "}
            Drafts below are local to this account, farm and browser.
          </p>
        </div>
        <Button
          variant="secondary"
          disabled={!drafts.length}
          onClick={() => safely(() => exportDrafts(drafts))}
        >
          <Download size={16} />
          Download JSON
        </Button>
      </header>
      <p className="offline-drafts-explainer">
        Reconnect and use Resume to review a draft in its original form before
        submitting. Nothing is sent automatically. These backups use the
        Fieldwork drafts format, not the event-batch format below.
      </p>
      <label className="field offline-import-label">
        <span>
          <Upload size={14} />
          Import a downloaded draft backup
        </span>
        <input
          type="file"
          accept="application/json,.json"
          onChange={async (e) => {
            try {
              setError(null);
              setNotice("");
              const file = e.target.files?.[0];
              if (!file) return;
              if (file.size > 5 * 1024 * 1024)
                throw new Error("Draft backup exceeds 5 MB.");
              const count = importDrafts(JSON.parse(await file.text()));
              setNotice(
                `${count} draft backups imported. They have not been sent to the server.`,
              );
            } catch (e) {
              setError(e);
            }
          }}
        />
      </label>
      {error != null && <ErrorBox error={error} />}
      {notice && (
        <p className="success-note" role="status">
          {notice}
        </p>
      )}
      {!drafts.length ? (
        <p className="offline-empty">
          No local drafts for this account and farm. Open a configuration or
          action form while connected; disconnected edits will then be backed up
          automatically.
        </p>
      ) : (
        <ul className="offline-draft-list">
          {drafts.map((draft) => (
            <li key={draft.id}>
              <div>
                <strong>{draft.label}</strong>
                <small>
                  {draft.kind === "record"
                    ? draft.recordId
                      ? "Edit record"
                      : "New record"
                    : "Farm action"}{" "}
                  · saved {new Date(draft.updatedAt).toLocaleString()}
                </small>
                <span>Local draft · not confirmed on server</span>
                {draft.reason === "connection_failed" && (
                  <p className="offline-outcome-note">
                    The connection failed during a request. Check the server for
                    an existing record before resubmitting; it may already have
                    been saved.
                  </p>
                )}
              </div>
              <div className="offline-draft-actions">
                <Button variant="ghost" onClick={() => setReview(draft)}>
                  Review
                </Button>
                <Button
                  variant="secondary"
                  onClick={() => safely(() => exportDrafts([draft]))}
                  aria-label={`Download ${draft.label}`}
                >
                  <Download size={15} />
                </Button>
                <Link
                  className="button button-primary"
                  to={resumePath(draft)}
                  onClick={onNavigate}
                >
                  Resume
                  <ArrowUpRight size={14} />
                </Link>
                <Button
                  variant="ghost"
                  aria-label={`Delete local draft ${draft.label}`}
                  onClick={() => setDeleting(draft)}
                >
                  <Trash2 size={15} />
                </Button>
              </div>
            </li>
          ))}
        </ul>
      )}
      <p className="field-help">
        Offline saving covers shared configuration create/edit forms and Actions
        forms. File uploads, map imports, sign-in, and work-detail Start/Confirm
        buttons still require the server. Open the app and relevant forms before
        disconnecting; a first launch or uncached reload offline is not
        supported.
      </p>
      {review && (
        <Modal
          wide
          title={`Local draft · ${review.label}`}
          description="These are local form values, not proof of a server save."
          onClose={() => setReview(null)}
        >
          <DetailTable entries={Object.entries(review.values)} />
          <p className="form-intro mt-4">
            Resume the original form to edit and submit. Record edits retain the
            original version so the backend can detect conflicts.
          </p>
          <div className="form-footer">
            <Button variant="secondary" onClick={() => setReview(null)}>
              Close
            </Button>
            <Button onClick={() => safely(() => exportDrafts([review]))}>
              <Download size={15} />
              Download draft
            </Button>
          </div>
        </Modal>
      )}
      {deleting && (
        <Modal
          title="Delete this local draft?"
          onClose={() => setDeleting(null)}
        >
          <p className="form-intro">
            This removes the local backup only. Download it first if you need a
            copy. Server records will not change.
          </p>
          <div className="form-footer">
            <Button variant="secondary" onClick={() => setDeleting(null)}>
              Keep draft
            </Button>
            <Button
              variant="danger"
              onClick={() =>
                safely(() => {
                  removeDraft(deleting.id);
                  setDeleting(null);
                })
              }
            >
              Delete local draft
            </Button>
          </div>
        </Modal>
      )}
    </section>
  );
}
export function OfflineDraftAccess() {
  const offline = useBrowserOffline();
  const all = useDrafts((s) => s.drafts);
  const owner = useSession((s) => s.user?.id);
  const mode = useSession((s) => s.mode);
  const farm = useWorkspace((s) => s.farm?.id);
  const count = all.filter(
    (d) => d.owner === owner && d.farm === farm && d.mode === mode,
  ).length;
  const [open, setOpen] = useState(false);
  return (
    <>
      <button
        className={"offline-access " + (offline ? "is-offline" : "")}
        onClick={() => setOpen(true)}
        aria-label={`Offline drafts: ${count}${offline ? ", offline saving mode" : ""}`}
      >
        <CloudOff size={17} />
        <span>{offline ? "Offline mode" : "Drafts"}</span>
        {count > 0 && <strong>{count}</strong>}
      </button>
      {open && (
        <Modal
          wide
          title="Offline saving & local drafts"
          onClose={() => setOpen(false)}
        >
          <OfflineDraftsPanel onNavigate={() => setOpen(false)} />
        </Modal>
      )}
    </>
  );
}
