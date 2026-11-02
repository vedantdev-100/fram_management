import type { Row } from "@/types";
import { Download } from "lucide-react";
import { Button } from "@/components/ui";
import { apiDownload } from "@/api/client";
import { useWorkspace } from "@/stores/workspace";
import { notify } from "@/stores/toasts";
export function AttachmentDetail({ record }: { record: Row }) {
  const farm = useWorkspace((s) => s.farm)!;
  return (
    <div>
      <dl className="detail-grid">
        <div>
          <dt>Document</dt>
          <dd>{String(record.original_name)}</dd>
        </div>
        <div>
          <dt>Kind</dt>
          <dd>{String(record.kind)}</dd>
        </div>
        <div>
          <dt>File size</dt>
          <dd>{Math.ceil(Number(record.size) / 1024)} KB</dd>
        </div>
      </dl>
      <div className="form-footer">
        <Button
          onClick={() =>
            apiDownload(
              `farms/${farm.id}/files/${record.id}/download/`,
              String(record.original_name || "document"),
            ).catch((e) => notify(e.message, "error"))
          }
        >
          <Download size={16} />
          Download document
        </Button>
      </div>
    </div>
  );
}
