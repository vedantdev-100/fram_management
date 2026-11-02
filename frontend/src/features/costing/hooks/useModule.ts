import { useResource } from "@/hooks/useResource";
import { api } from "../api";
export function useModule(resource: string, filters: Record<string, string>) {
  return useResource(resource, filters, api);
}
