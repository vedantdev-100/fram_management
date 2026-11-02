import { useQuery, useMutation } from "@tanstack/react-query";
import { farmsApi } from "../api";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { queryClient } from "@/api/queryClient";
export function useFarms() {
  const user = useSession((s) => s.user);
  return useQuery({
    queryKey: ["farms", user?.id],
    queryFn: farmsApi.list,
    enabled: !!user,
  });
}
export function useCreateFarm() {
  return useMutation({
    mutationFn: farmsApi.create,
    onSuccess: async (farm) => {
      queryClient.removeQueries({ queryKey: ["farm"] });
      useWorkspace.getState().setFarm(farm);
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
    },
  });
}
