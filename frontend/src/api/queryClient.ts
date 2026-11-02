import { QueryClient } from "@tanstack/react-query";
import { ApiError } from "./client";
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30000,
      retry: (count, error) =>
        !(
          error instanceof ApiError &&
          error.status >= 400 &&
          error.status < 500
        ) && count < 1,
      refetchOnWindowFocus: false,
    },
  },
});
export async function refreshFarmQueries() {
  await queryClient.invalidateQueries({
    predicate: (q) => q.queryKey[0] === "farm",
  });
}
