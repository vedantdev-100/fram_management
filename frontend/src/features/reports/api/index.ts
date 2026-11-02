import { apiRequest, apiDownload } from "@/api/client";
import type { ReportName, ReportRow } from "../types";
export const reportApi = {
  get: (farm: string, name: ReportName) =>
    apiRequest<ReportRow[]>(`farms/${farm}/reports/${name}/`),
  download: (farm: string, name: ReportName) =>
    apiDownload(`farms/${farm}/reports/${name}/?format=csv`, `${name}.csv`),
};
