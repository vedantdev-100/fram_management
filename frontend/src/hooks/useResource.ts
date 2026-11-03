import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useWorkspace } from "@/stores/workspace";
import { apiRequest } from "@/api/client";
import { refreshFarmQueries } from "@/api/queryClient";
import { notify } from "@/stores/toasts";
import type { ModuleApi, Page } from "@/types";
export function useResource(
  resource: string,
  filters: Record<string, string>,
  api: ModuleApi,
) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useInfiniteQuery({
    queryKey: ["farm", farm, resource, filters],
    enabled: !!farm,
    initialPageParam: null as string | null,
    queryFn: ({ pageParam, signal }) =>
      pageParam
        ? apiRequest<Page>(pageParam, { signal })
        : api.list(farm, resource, filters, signal),
    getNextPageParam: (last) => last.next ?? undefined,
  });
}
export function useRecord(
  resource: string,
  id: string | undefined,
  api: ModuleApi,
) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useQuery({
    queryKey: ["farm", farm, resource, id],
    staleTime: 0,
    queryFn: () => api.get(farm, resource, id!),
    enabled: !!farm && !!id,
  });
}
export function useSaveRecord(resource: string, api: ModuleApi) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useMutation({
    networkMode: "always",
    mutationFn: ({
      id,
      values,
    }: {
      id?: string;
      values: Record<string, unknown>;
    }) =>
      id
        ? api.patch(farm, resource, id, values)
        : api.create(farm, resource, values),
    onSuccess: () => {
      void refreshFarmQueries();
      notify("Record saved");
    },
  });
}
