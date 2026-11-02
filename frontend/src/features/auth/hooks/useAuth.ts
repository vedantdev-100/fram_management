import { useMutation } from "@tanstack/react-query";
import { authApi } from "../api";
import { useSession } from "@/stores/session";
import { useWorkspace } from "@/stores/workspace";
import { queryClient } from "@/api/queryClient";
import type { Credentials, Registration } from "../types";
export function useLogin() {
  return useMutation({
    mutationFn: async (data: Credentials) => {
      useSession.getState().clear();
      const tokens = await authApi.login(data);
      useSession.getState().setTokens(tokens.access, tokens.refresh);
      const user = await authApi.me();
      queryClient.clear();
      useWorkspace.getState().setFarm(null);
      useSession.getState().setUser(user);
      useSession.getState().setReady(true);
      return user;
    },
  });
}
export function useRegister() {
  return useMutation({
    mutationFn: (data: Registration) => authApi.register(data),
  });
}
export async function startDemo() {
  const { demoUser, demoFarm } = await import("@/demo/data");
  queryClient.clear();
  useWorkspace.getState().setFarm(demoFarm);
  useSession.getState().startDemo(demoUser);
}
