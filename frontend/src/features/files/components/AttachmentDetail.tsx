import {
  DetailSection,
  DetailTable,
} from "@/components/workspace/RecordDetails";
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
      <DetailSection title="Document details">
        <DetailTable
          entries={[
            ["document", record.original_name],
            ["kind", record.kind],
            ["file_size", `${Math.ceil(Number(record.size) / 1024)} KB`],
            ["created_at", record.created_at],
          ]}
        />
      </DetailSection>
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
