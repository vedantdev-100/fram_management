import { AttachmentDetail } from "../components/AttachmentDetail";
import { UploadAttachment } from "../components/UploadAttachment";
import { ModuleWorkspace } from "@/components/workspace/ModuleWorkspace";
import { resources } from "../components/resources";
import { commands } from "../components/commands";
import { useModule } from "../hooks/useModule";
import { api } from "../api";
export default function Page() {
  return (
    <ModuleWorkspace
      title="Documents"
      description="Photos, bills and supporting records"
      feature="files"
      resources={resources}
      commands={commands}
      api={api}
      useRecords={useModule}
      renderDetail={(row, resource) =>
        resource === "attachments" ? (
          <AttachmentDetail record={row} />
        ) : undefined
      }
      toolbar={<UploadAttachment />}
    />
  );
}
