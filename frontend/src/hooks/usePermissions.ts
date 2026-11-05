import { useQuery } from "@tanstack/react-query";
import { apiRequest } from "@/api/client";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { permissionChecks } from "@/lib/permissions";
export interface FarmAccess {
  farm_id: string;
  membership_id: string;
  role: { id: string; code: string; name: string };
  permissions: string[];
}
export function usePermissions() {
  const user = useSession((s) => s.user?.id);
  const preview = useSession((s) => s.mode === "demo");
  const farm = useWorkspace((s) => s.farm?.id);
  const enabled = !!user && !!farm && !preview;
  const q = useQuery({
    queryKey: ["farm", farm, "access", user],
    enabled,
    queryFn: () => apiRequest<FarmAccess>(`farms/${farm}/access/`),
    staleTime: 30000,
    refetchOnWindowFocus: true,
  });
  const data = preview
    ? {
        farm_id: farm || "",
        membership_id: "preview",
        role: { id: "preview", code: "preview", name: "Preview workspace" },
        permissions: [],
      }
    : q.data;
  return {
    ...permissionChecks(data?.permissions || [], preview),
    data,
    error: q.error,
    isLoading: enabled && q.isPending,
    refetch: q.refetch,
  };
}
