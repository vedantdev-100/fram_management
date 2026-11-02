import { apiRequest } from "@/api/client";
import type { Farm } from "@/types";
export const farmsApi = {
  list: () => apiRequest<Farm[]>("farms/"),
  create: (body: unknown) =>
    apiRequest<Farm>("farms/", { method: "POST", body: JSON.stringify(body) }),
};
