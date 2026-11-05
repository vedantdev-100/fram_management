import { SecretCode } from "@/components/SecretCode";
import { ChevronRight } from "lucide-react";
import type { Row, ResourceDefinition } from "@/types";
import { Badge } from "@/components/ui";
import { humanize, money, number, shortDate, dateTime } from "@/lib/format";
import { useWorkspace } from "@/stores/workspace";
import { ReferenceLabel } from "@/components/forms/ReferencePicker";
export function Value({
  column,
  value,
  relation,
}: {
  column: string;
  value: unknown;
  relation?: string;
}) {
  const farm = useWorkspace((s) => s.farm);
  if (column === "invitation_code") return <SecretCode value={value} />;
  if (["member_name", "member_email", "email"].includes(column))
    return <>{String(value ?? "—")}</>;
  if (value === null || value === undefined || value === "")
    return <span className="muted">—</span>;
  if (relation) return <ReferenceLabel resource={relation} id={value} />;
  if (["status", "result"].includes(column)) return <Badge value={value} />;
  if (typeof value === "boolean") return <>{value ? "Yes" : "No"}</>;
  if (
    column.endsWith("_at") ||
    column.endsWith("_start") ||
    column.endsWith("_end")
  )
    return <>{dateTime(value, farm?.timezone)}</>;
  if (column.includes("date") || column.endsWith("_on"))
    return <>{shortDate(value)}</>;
  if (
    /cost|amount|balance|revenue|margin|principal|price|book_value|salvage/.test(
      column,
    )
  )
    return (
      <span className="tabular-nums">{money(value, farm?.currency_code)}</span>
    );
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value))
  )
    return (
      <span className="tabular-nums">
        {number(value)}
        {column === "area_m2" ? " m²" : ""}
      </span>
    );
  if (typeof value === "object")
    return <span className="muted">Structured details</span>;
  return <>{humanize(value)}</>;
}
export function DataTable({
  rows,
  resource,
  onSelect,
}: {
  rows: Row[];
  resource: ResourceDefinition;
  onSelect: (row: Row) => void;
}) {
  const columns = resource.columns;
  return (
    <>
      <div className="data-table-wrap">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{humanize(c)}</th>
              ))}
              <th>
                <span className="sr-only">Open record</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                {columns.map((c, i) => (
                  <td key={c}>
                    {i === 0 ? (
                      <button
                        className="table-title"
                        onClick={() => onSelect(row)}
                      >
                        <Value
                          column={c}
                          value={row[c]}
                          relation={resource.relations[c]}
                        />
                      </button>
                    ) : (
                      <Value
                        column={c}
                        value={row[c]}
                        relation={resource.relations[c]}
                      />
                    )}
                  </td>
                ))}
                <td>
                  <button
                    aria-label="Open record"
                    className="icon-button"
                    onClick={() => onSelect(row)}
                  >
                    <ChevronRight size={17} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="mobile-records">
        {rows.map((row) => (
          <article className="mobile-record" key={row.id}>
            <button
              type="button"
              className="mobile-record-title"
              onClick={() => onSelect(row)}
            >
              <strong>
                <Value
                  column={columns[0]}
                  value={row[columns[0]]}
                  relation={resource.relations[columns[0]]}
                />
              </strong>
              <ChevronRight size={17} />
            </button>
            {columns
              .slice(1, resource.key === "invitations" ? undefined : 4)
              .map((c) => (
                <div className="mobile-record-line" key={c}>
                  <span>{humanize(c)}</span>
                  <Value
                    column={c}
                    value={row[c]}
                    relation={resource.relations[c]}
                  />
                </div>
              ))}
          </article>
        ))}
      </div>
    </>
  );
}
