import { Select } from "@/components/forms/Select";
import { usePermissions } from "@/hooks/usePermissions";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Upload, Download, MapPin } from "lucide-react";
import { apiRequest, apiDownload } from "@/api/client";
import { useWorkspace } from "@/stores/workspace";
import { Button, Modal, ErrorBox } from "@/components/ui";
import { ReferencePicker } from "@/components/forms/ReferencePicker";
import { api } from "../api";
import { refreshFarmQueries } from "@/api/queryClient";
import { notify } from "@/stores/toasts";
interface Imported {
  features: { geometry: unknown; properties: { area_m2: string } }[];
}
export function BoundaryTools() {
  const access = usePermissions();
  const farm = useWorkspace((s) => s.farm)!;
  const [open, setOpen] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [block, setBlock] = useState("");
  const [selected, setSelected] = useState(0);
  const [error, setError] = useState<unknown>(null);
  const preview = useMutation({
    mutationFn: async () => {
      if (!file) throw new Error("Select a boundary file.");
      const data = new FormData();
      data.append("file", file);
      return apiRequest<Imported>(
        `farms/${farm.id}/boundaries/import-preview/`,
        { method: "POST", body: data },
      );
    },
  });
  const save = useMutation({
    mutationFn: async () => {
      const record = await api.get(farm.id, "blocks", block);
      return api.command(farm.id, "set_boundary", {
        block_id: block,
        version: record.version,
        geometry: preview.data!.features[selected].geometry,
        source: "imported",
        note: "Reviewed imported boundary",
      });
    },
    onSuccess: async () => {
      await refreshFarmQueries();
      setOpen(false);
      notify("Boundary saved with revision history");
    },
  });
  return (
    <>
      <div className="feature-toolbar">
        <div>
          <MapPin size={20} />
          <span>
            Keep entered areas, or add reviewed boundaries for a spatial record.
          </span>
        </div>
        <div className="flex gap-2">
          {access.has("reporting.report.export") && (
            <Button
              variant="secondary"
              onClick={() =>
                apiDownload(
                  `farms/${farm.id}/boundaries/export/`,
                  "farm-boundaries.geojson",
                ).catch((e) => notify(e.message, "error"))
              }
            >
              <Download size={16} />
              GeoJSON
            </Button>
          )}
          {access.has("land.block.edit_boundary") && (
            <Button
              variant="secondary"
              onClick={() => {
                preview.reset();
                save.reset();
                setError(null);
                setOpen(true);
              }}
            >
              <Upload size={16} />
              Import boundary
            </Button>
          )}
        </div>
      </div>
      {open && (
        <Modal
          title="Review an imported boundary"
          onClose={() => setOpen(false)}
          busy={save.isPending}
        >
          <p className="form-intro">
            A saved boundary recalculates the block area. Review the shape
            before applying it; existing crop allocations keep their recorded
            areas.
          </p>
          <label className="field">
            Boundary file
            <input
              type="file"
              accept=".geojson,.json,.kml,.zip"
              onChange={(e) => {
                setFile(e.target.files?.[0] || null);
                setSelected(0);
                preview.reset();
              }}
            />
          </label>
          <Button
            variant="secondary"
            loading={preview.isPending}
            disabled={!file}
            onClick={() => preview.mutate()}
          >
            Validate and preview
          </Button>
          {preview.data && (
            <>
              <label className="field mt-5">
                Choose boundary
                <Select
                  value={selected}
                  onChange={(e) => setSelected(Number(e.target.value))}
                >
                  {preview.data.features.map((f, i) => (
                    <option key={i} value={i}>
                      Boundary {i + 1} ·{" "}
                      {Number(f.properties.area_m2).toLocaleString()} m²
                    </option>
                  ))}
                </Select>
              </label>
              <pre className="geometry-preview">
                {JSON.stringify(
                  preview.data.features[selected]?.geometry,
                  null,
                  2,
                )}
              </pre>
              <label className="field">
                Apply to block
                <ReferencePicker
                  id="boundary-block"
                  resource="blocks"
                  value={block}
                  onChange={setBlock}
                  required
                />
              </label>
              <div className="form-footer">
                <Button
                  loading={save.isPending}
                  disabled={!block || !preview.data.features.length}
                  onClick={() => save.mutate()}
                >
                  Save reviewed boundary
                </Button>
              </div>
            </>
          )}
          {Boolean(preview.error || save.error || error) && (
            <ErrorBox error={preview.error || save.error || error} />
          )}
        </Modal>
      )}
    </>
  );
}
