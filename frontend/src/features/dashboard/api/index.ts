import { allRecords } from "@/api/resources";
import type { OverviewData } from "../types";
export async function loadOverview(
  farm: string,
  signal?: AbortSignal,
): Promise<OverviewData> {
  const names = ["blocks", "crop-cycles", "events", "stock-items"];
  const settled = await Promise.allSettled(
    names.map((r) => allRecords(farm, r, signal)),
  );
  if (settled.every((r) => r.status === "rejected"))
    throw (settled[0] as PromiseRejectedResult).reason;
  const read = (n: number) =>
    settled[n].status === "fulfilled" ? settled[n].value.rows : [];
  return {
    blocks: read(0),
    cycles: read(1),
    events: read(2),
    stock: read(3),
    truncated: settled.some(
      (r) => r.status === "fulfilled" && r.value.truncated,
    ),
    unavailable: names.filter((_, i) => settled[i].status === "rejected"),
  };
}
