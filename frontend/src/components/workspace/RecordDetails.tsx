import { InfoHint } from "@/components/InfoHint";
import { knownFieldHelp } from "@/lib/fieldHelp";
import type { ReactNode } from "react";
import type { ResourceDefinition, Row } from "@/types";
import { Badge } from "@/components/ui";
import { humanize } from "@/lib/format";
import { Value } from "./DataTable";

type Entry = [string, unknown];
const technical = new Set([
  "id",
  "farm",
  "version",
  "created_at",
  "updated_at",
  "created_by",
  "updated_by",
  "client_uuid",
  "request_hash",
]);
const narrative =
  /^(notes?|description|reason|override_reason|message|content|summary)$/;
const isObject = (v: unknown): v is Record<string, unknown> =>
  !!v && typeof v === "object" && !Array.isArray(v);

export function DetailValue({
  name,
  value,
  relation,
  depth = 0,
}: {
  name: string;
  value: unknown;
  relation?: string;
  depth?: number;
}) {
  if (value == null || value === "")
    return <span className="muted">Not provided</span>;
  if (relation)
    return <Value column={name} value={value} relation={relation} />;
  if (
    ["geometry", "coordinates", "centroid"].includes(name) &&
    typeof value === "object"
  ) {
    const kind =
      isObject(value) && typeof value.type === "string"
        ? value.type
        : "Coordinates";
    return (
      <details className="detail-json">
        <summary>{kind} · View geometry data</summary>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </details>
    );
  }
  if (
    /cost|amount|balance|revenue|margin|principal|price|book_value|salvage/.test(
      name,
    ) &&
    (typeof value === "number" ||
      (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value)))
  ) {
    return <Value column={name} value={value} />;
  }
  if (
    typeof value === "number" ||
    (typeof value === "string" && /^-?\d+(\.\d+)?$/.test(value))
  ) {
    return (
      <span className="tabular-nums">
        {String(value)}
        {name === "area_m2" ? " m²" : ""}
      </span>
    );
  }
  if (depth >= 4 && typeof value === "object")
    return (
      <details className="detail-json">
        <summary>View nested data</summary>
        <pre>{JSON.stringify(value, null, 2)}</pre>
      </details>
    );
  if (Array.isArray(value)) {
    if (!value.length) return <span className="muted">No items</span>;
    if (value.every(isObject)) {
      const columns = [...new Set(value.flatMap((item) => Object.keys(item)))];
      return (
        <div
          className="detail-table-scroll"
          role="region"
          aria-label={`${humanize(name)} items`}
          tabIndex={0}
        >
          <table className="detail-items-table">
            <caption className="sr-only">{humanize(name)}</caption>
            <thead>
              <tr>
                {columns.map((key) => (
                  <th key={key} scope="col">
                    {humanize(key)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {value.map((item, index) => (
                <tr key={index}>
                  {columns.map((key) => (
                    <td key={key}>
                      <DetailValue
                        name={key}
                        value={item[key]}
                        depth={depth + 1}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      );
    }
    return (
      <ul className="detail-list">
        {value.map((item, index) => (
          <li key={index}>
            <DetailValue name={name} value={item} depth={depth + 1} />
          </li>
        ))}
      </ul>
    );
  }
  if (isObject(value))
    return <DetailTable entries={Object.entries(value)} depth={depth + 1} />;
  if (typeof value === "string") {
    // Keep names, codes, identifiers and prose exactly as entered.
    const dateField =
      /(_at|_start|_end|_date|_on)$/.test(name) || name.includes("date");
    if (dateField && Number.isNaN(Date.parse(value)))
      return <span className="detail-text">{value}</span>;
    if (
      !dateField &&
      !["status", "result"].includes(name) &&
      !/^-?\d+(\.\d+)?$/.test(value)
    )
      return <span className="detail-text">{value}</span>;
  }
  return <Value column={name} value={value} />;
}

export function DetailTable({
  entries,
  relations = {},
  depth = 0,
}: {
  entries: Entry[];
  relations?: Record<string, string>;
  depth?: number;
}) {
  return (
    <table className="detail-table">
      <caption className="sr-only">Record fields</caption>
      <tbody>
        {entries.map(([name, value]) => (
          <tr key={name}>
            <th scope="row">
              <span className="field-label-row">
                <span>{humanize(name)}</span>
                {knownFieldHelp(name) && (
                  <InfoHint
                    label={humanize(name)}
                    description={knownFieldHelp(name)!}
                  />
                )}
              </span>
            </th>
            <td>
              <DetailValue
                name={name}
                value={value}
                relation={relations[name]}
                depth={depth}
              />
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
export function DetailSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="detail-section">
      <h3>{title}</h3>
      {children}
    </section>
  );
}

export function RecordDetails({
  record,
  resource,
}: {
  record: Row;
  resource?: ResourceDefinition;
}) {
  const entries = Object.entries(record);
  const visible = entries.filter(
    ([name]) => !technical.has(name) && name !== "status",
  );
  const overview = visible.filter(
    ([name, value]) =>
      !narrative.test(name) && (value == null || typeof value !== "object"),
  );
  overview.sort(([a], [b]) => {
    const priority = resource?.columns || ["name", "code", "title"];
    const rank = (key: string) =>
      priority.includes(key) ? priority.indexOf(key) : priority.length;
    return rank(a) - rank(b);
  });
  const notes = visible.filter(([name]) => narrative.test(name));
  const structured = visible.filter(
    ([name, value]) =>
      !narrative.test(name) && value != null && typeof value === "object",
  );
  const metadata = entries.filter(([name]) => technical.has(name));
  return (
    <div className="record-details">
      <div className="detail-context">
        <span>{resource?.title || "Record details"}</span>
        {record.status != null && <Badge value={record.status} />}
      </div>
      {!!overview.length && (
        <DetailSection title="Overview">
          <DetailTable entries={overview} relations={resource?.relations} />
        </DetailSection>
      )}
      {notes.map(([name, value]) => (
        <DetailSection key={name} title={humanize(name)}>
          <div className="detail-note">
            <DetailValue name={name} value={value} />
          </div>
        </DetailSection>
      ))}
      {structured.map(([name, value]) => (
        <DetailSection key={name} title={humanize(name)}>
          <div className="detail-structured">
            <DetailValue name={name} value={value} />
          </div>
        </DetailSection>
      ))}
      {!!metadata.length && (
        <details className="detail-metadata">
          <summary>
            Record information <span>IDs, timestamps & version</span>
          </summary>
          <DetailTable entries={metadata} />
        </details>
      )}
    </div>
  );
}
