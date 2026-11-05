import { apiRequest } from "@/api/client";
import type { Farm } from "@/types";
export const farmsApi = {
  acceptInvitation: (token: string) =>
    apiRequest<{ farm_id: string }>("auth/invitation/accept/", {
      method: "POST",
      body: JSON.stringify({ token }),
    }),
  list: () => apiRequest<Farm[]>("farms/"),
  create: (body: unknown) =>
    apiRequest<Farm>("farms/", { method: "POST", body: JSON.stringify(body) }),
};
