import { useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/stores/workspace";
import { loadOverview } from "../api";
export function useOverview() {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useQuery({
    queryKey: ["farm", farm, "overview"],
    queryFn: ({ signal }) => loadOverview(farm, signal),
    enabled: !!farm,
  });
}
