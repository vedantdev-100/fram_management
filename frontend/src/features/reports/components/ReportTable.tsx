import { Value } from "@/components/workspace/DataTable";
import { humanize } from "@/lib/format";
import type { ReportRow } from "../types";
export function ReportTable({ rows }: { rows: ReportRow[] }) {
  const columns = Object.keys(rows[0] || {});
  return (
    <div className="report-table-wrap">
      <table className="data-table">
        <thead>
          <tr>
            {columns.map((c) => (
              <th key={c}>{humanize(c)}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((r, i) => (
            <tr key={i}>
              {columns.map((c) => (
                <td key={c}>
                  <Value column={c} value={r[c]} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
