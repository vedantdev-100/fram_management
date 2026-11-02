import { useWorkspace } from "@/stores/workspace";
import { queryClient } from "@/api/queryClient";
import type { Farm } from "@/types";
import { createModuleApi } from "@/api/resources";
const base = createModuleApi(["roles", "members", "invitations"]);

export const api = {
  ...base,
  command: async (farm: string, key: string, body: unknown) => {
    const result = await base.command(farm, key, body);
    if (key === "update_farm") {
      useWorkspace.getState().setFarm(result as Farm);
      await queryClient.invalidateQueries({ queryKey: ["farms"] });
    }
    return result;
  },
};
