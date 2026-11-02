import { apiRequest } from "./client";
import type { ModuleApi, Page, Row } from "@/types";
export const farmPath = (farm: string, path: string) =>
  `farms/${encodeURIComponent(farm)}/${path}`;
export function createModuleApi(resources: string[]): ModuleApi {
  const allowed = (r: string) => {
    if (!resources.includes(r))
      throw new Error("Resource is outside this feature boundary");
    return r;
  };
  return {
    list: (farm, r, params = {}, signal) =>
      apiRequest<Page>(
        farmPath(farm, allowed(r) + "/") + "?" + new URLSearchParams(params),
        { signal },
      ),
    get: (farm, r, id) =>
      apiRequest<Row>(
        farmPath(farm, allowed(r) + "/" + encodeURIComponent(id) + "/"),
      ),
    create: (farm, r, body) =>
      apiRequest<Row>(farmPath(farm, allowed(r) + "/"), {
        method: "POST",
        body: JSON.stringify(body),
      }),
    patch: (farm, r, id, body) =>
      apiRequest<Row>(
        farmPath(farm, allowed(r) + "/" + encodeURIComponent(id) + "/"),
        { method: "PATCH", body: JSON.stringify(body) },
      ),
    command: (farm, command, body) =>
      apiRequest(
        farmPath(farm, "commands/" + encodeURIComponent(command) + "/"),
        { method: "POST", body: JSON.stringify(body) },
      ),
  };
}
export async function allRecords(
  farm: string,
  resource: string,
  signal?: AbortSignal,
) {
  let url: string | null = farmPath(farm, resource + "/");
  const rows: Row[] = [];
  let pages = 0;
  while (url && pages < 50) {
    const page: Page = await apiRequest<Page>(url, { signal });
    rows.push(...page.results);
    url = page.next;
    pages++;
  }
  return { rows, truncated: !!url };
}
