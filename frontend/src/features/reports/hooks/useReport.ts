import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/stores/workspace";
import { reportApi } from "../api";
import type { ReportName } from "../types";
export function useReport(name: ReportName) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useQuery({
    queryKey: ["farm", farm, "report", name],
    queryFn: () => reportApi.get(farm, name),
    enabled: !!farm,
  });
}
