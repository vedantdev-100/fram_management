import { useState } from "react";
import { Upload, FileUp } from "lucide-react";
import { useMutation } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import { useWorkspace } from "@/stores/workspace";
import { Button, Modal, ErrorBox } from "@/components/ui";
import { ReferencePicker } from "@/components/forms/ReferencePicker";
import { refreshFarmQueries } from "@/api/queryClient";
import { notify } from "@/stores/toasts";
const targets = [
  { resource: "events", model: "events.Event", label: "Farm work" },
  { resource: "blocks", model: "land.Block", label: "Land block" },
  { resource: "crop-cycles", model: "land.CropCycle", label: "Crop cycle" },
  { resource: "assets", model: "assets.Asset", label: "Asset" },
  { resource: "entries", model: "ledger.LedgerEntry", label: "Money entry" },
];
export function UploadAttachment() {
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [target, setTarget] = useState(targets[0]);
  const [id, setId] = useState("");
  const [kind, setKind] = useState("photo");
  const farm = useWorkspace((s) => s.farm)!;
  const [localError, setLocalError] = useState<unknown>(null);
  const mutation = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Choose a file first.");
      if (file.size > 10 * 1024 * 1024)
        throw new Error("The file must be smaller than 10 MB.");
      const data = new FormData();
      data.append("file", file);
      data.append("target_type", target.model);
      data.append("target_id", id);
      data.append("kind", kind);
      return apiRequest(`farms/${farm.id}/files/upload/`, {
        method: "POST",
        body: data,
      });
    },
    onSuccess: async () => {
      await refreshFarmQueries();
      setOpen(false);
      setFile(null);
      notify("Document attached");
    },
  });
  return (
    <>
      <div className="feature-toolbar">
        <div>
          <FileUp size={20} />
          <span>
            Keep photos, bills and supporting documents with their farm records.
          </span>
        </div>
        <Button
          onClick={() => {
            mutation.reset();
            setOpen(true);
          }}
        >
          <Upload size={16} />
          Attach a file
        </Button>
      </div>
      {open && (
        <Modal
          title="Attach a document"
          onClose={() => setOpen(false)}
          busy={mutation.isPending}
        >
          <form
            onSubmit={(e) => {
              e.preventDefault();
              setLocalError(null);
              mutation.mutate();
            }}
          >
            <label className="field">
              File
              <input
                type="file"
                accept="image/jpeg,image/png,application/pdf"
                required
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <small className="field-help">
                JPEG, PNG or PDF · maximum 10 MB.
              </small>
            </label>
            <div className="form-grid">
              <label className="field">
                Attach to
                <select
                  value={target.resource}
                  onChange={(e) => {
                    setTarget(
                      targets.find((t) => t.resource === e.target.value)!,
                    );
                    setId("");
                  }}
                >
                  {targets.map((t) => (
                    <option key={t.resource} value={t.resource}>
                      {t.label}
                    </option>
                  ))}
                </select>
              </label>
              <label className="field">
                Kind
                <select value={kind} onChange={(e) => setKind(e.target.value)}>
                  {["photo", "bill", "certificate", "other"].map((k) => (
                    <option key={k}>{k}</option>
                  ))}
                </select>
              </label>
            </div>
            <label className="field">
              Choose the record
              <ReferencePicker
                id="attachment-target"
                resource={target.resource}
                value={id}
                onChange={setId}
                required
              />
            </label>
            {Boolean(mutation.error || localError) && (
              <ErrorBox error={mutation.error || localError} />
            )}
            <div className="form-footer">
              <Button type="submit" loading={mutation.isPending}>
                Upload attachment
              </Button>
            </div>
          </form>
        </Modal>
      )}
    </>
  );
}
