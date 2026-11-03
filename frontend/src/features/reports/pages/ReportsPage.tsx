import { ResourceTabs } from "@/components/workspace/ResourceTabs";
import { useId } from "react";
import { useState } from "react";
import { Download } from "lucide-react";
import {
  PageHeader,
  Button,
  Spinner,
  ErrorBox,
  EmptyState,
} from "@/components/ui";
import { useWorkspace } from "@/stores/workspace";
import { notify } from "@/stores/toasts";
import { useReport } from "../hooks/useReport";
import { reportApi } from "../api";
import { ReportTable } from "../components/ReportTable";
import type { ReportName } from "../types";
const reports: { key: ReportName; label: string }[] = [
  { key: "crop-cycle-profit-loss", label: "Crop cycle margin" },
  { key: "operation-cost", label: "Operation costs" },
  { key: "plan-versus-actual", label: "Plan versus actual" },
  { key: "cash-timeline", label: "Cash accounts" },
  { key: "stock-status", label: "Stock status" },
  { key: "availability", label: "Reservations" },
  { key: "utilisation", label: "Machine use" },
];
const reportTabs = reports.map((report) => ({
  key: report.key,
  title: report.label,
}));
export default function ReportsPage() {
  const tabId = useId();
  const [name, setName] = useState<ReportName>("crop-cycle-profit-loss");
  const [downloading, setDownloading] = useState(false);
  const farm = useWorkspace((s) => s.farm)!;
  const q = useReport(name);
  return (
    <div className="page-enter">
      <PageHeader
        eyebrow="A CLEARER PICTURE"
        title="Farm insights"
        description="Review the records behind your decisions."
        actions={
          <Button
            variant="secondary"
            loading={downloading}
            onClick={async () => {
              setDownloading(true);
              try {
                await reportApi.download(farm.id, name);
              } catch (e) {
                notify((e as Error).message, "error");
              } finally {
                setDownloading(false);
              }
            }}
          >
            <Download size={17} />
            Export CSV
          </Button>
        }
      />
      <ResourceTabs
        id={tabId}
        title="Farm insights"
        resources={reportTabs}
        active={name}
        onSelect={(key) => {
          const selected = reports.find((report) => report.key === key);
          if (selected) setName(selected.key);
        }}
      />
      <section
        key={name}
        className="panel resource-tab-panel"
        id={`${tabId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${name}`}
        tabIndex={0}
      >
        {q.isLoading ? (
          <Spinner />
        ) : q.isError ? (
          <div className="p-6">
            <ErrorBox error={q.error} retry={() => q.refetch()} />
          </div>
        ) : q.data?.length ? (
          <ReportTable rows={q.data} />
        ) : (
          <EmptyState
            title="No figures for this report yet"
            description="Complete farm operations and money records to build the picture."
          />
        )}
      </section>
      <p className="below-table-note">
        Reports reflect the records and calculations provided by your backend.
        Missing financial fields are shown as unavailable, not zero.
      </p>
    </div>
  );
}
