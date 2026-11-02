import { apiRequest } from "@/api/client";
import type { User } from "@/types";
import type { Credentials, Registration } from "../types";
export const authApi = {
  login: (data: Credentials) =>
    apiRequest<{ access: string; refresh: string }>("auth/token/", {
      public: true,
      method: "POST",
      body: JSON.stringify(data),
    }),
  register: (data: Registration) =>
    apiRequest("auth/register/", {
      public: true,
      method: "POST",
      body: JSON.stringify(data),
    }),
  me: () => apiRequest<User>("auth/me/"),
  reset: (email: string) =>
    apiRequest("auth/password-reset/", {
      public: true,
      method: "POST",
      body: JSON.stringify({ email }),
    }),
  confirmReset: (data: { uid: string; token: string; password: string }) =>
    apiRequest("auth/password-reset/confirm/", {
      public: true,
      method: "POST",
      body: JSON.stringify(data),
    }),
};
