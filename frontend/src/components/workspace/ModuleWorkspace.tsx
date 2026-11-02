import { useEffect } from "react";
import type { ReactNode } from "react";
import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import {
  Plus,
  Search,
  RefreshCw,
  SlidersHorizontal,
  ArrowDown,
} from "lucide-react";
import type {
  CommandDefinition,
  ResourceDefinition,
  ModuleApi,
  Row,
} from "@/types";
import { useResource, useSaveRecord, useRecord } from "@/hooks/useResource";
import {
  PageHeader,
  Button,
  Spinner,
  ErrorBox,
  EmptyState,
  Modal,
} from "@/components/ui";
import { RecordForm } from "@/components/forms/RecordForm";
import { DataTable, Value } from "./DataTable";
import { CommandForm } from "./CommandForm";
import { humanize, labelFor } from "@/lib/format";
interface Props {
  title: string;
  description: string;
  feature: string;
  resources: ResourceDefinition[];
  commands: CommandDefinition[];
  api: ModuleApi;
  useRecords: typeof useResource;
  renderDetail?: (row: Row, resource: string) => ReactNode;
  toolbar?: ReactNode;
}
export function ModuleWorkspace({
  title,
  description,
  feature,
  resources,
  commands,
  api,
  useRecords,
  renderDetail,
  toolbar,
}: Props) {
  const [params, setParams] = useSearchParams();
  const resource =
    resources.find((r) => r.key === params.get("tab")) || resources[0];
  const [search, setSearch] = useState(params.get("search") || "");
  const [showCreate, setShowCreate] = useState(false);
  const [command, setCommand] = useState<CommandDefinition | null>(null);
  const [detailId, setDetailId] = useState<string | undefined>(
    params.get("record") || undefined,
  );
  const [edit, setEdit] = useState(false);
  const [result, setResult] = useState<unknown>(null);
  useEffect(() => {
    const action = params.get("action");
    if (action) setCommand(commands.find((c) => c.key === action) || null);
  }, [params, commands]);
  const query = useRecords(resource.key, {}, api);
  const save = useSaveRecord(resource.key, api);
  const detail = useRecord(resource.key, detailId, api);
  const rows = query.data?.pages.flatMap((p) => p.results) || [];
  const visible = rows.filter((r) =>
    resource.columns.some((c) =>
      String(r[c] ?? "")
        .toLowerCase()
        .includes(search.toLowerCase()),
    ),
  );
  const current = detail.data;
  const relevant = commands.filter(
    (c) => !c.resource || c.resource === resource.key,
  );
  return (
    <div className="page-enter" key={feature}>
      <PageHeader
        eyebrow="YOUR FARM WORKSPACE"
        title={title}
        description={description}
        actions={
          <>
            {relevant.length > 0 && (
              <select
                className="action-select"
                aria-label="Choose an action"
                value=""
                onChange={(e) =>
                  setCommand(
                    commands.find((c) => c.key === e.target.value) || null,
                  )
                }
              >
                <option value="">Actions</option>
                {relevant.map((c) => (
                  <option key={c.key} value={c.key}>
                    {c.label}
                  </option>
                ))}
              </select>
            )}
            {(resource.editable || resource.createCommand) && (
              <Button
                onClick={() => {
                  if (resource.createCommand) {
                    setCommand(
                      commands.find((c) => c.key === resource.createCommand) ||
                        null,
                    );
                  } else {
                    save.reset();
                    setShowCreate(true);
                  }
                }}
              >
                <Plus size={17} />
                {resource.createCommand
                  ? commands.find((c) => c.key === resource.createCommand)
                      ?.label
                  : "Add " + resource.title.toLowerCase().replace(/s$/, "")}
              </Button>
            )}
          </>
        }
      />
      {toolbar}
      <div
        className="resource-tabs"
        role="navigation"
        aria-label={`${title} sections`}
      >
        {resources.map((r) => (
          <button
            key={r.key}
            className={r.key === resource.key ? "active" : ""}
            onClick={() => {
              setParams({ tab: r.key });
              setSearch("");
              setDetailId(undefined);
            }}
          >
            {r.title}
          </button>
        ))}
      </div>
      <section className="panel">
        <div className="table-toolbar">
          <div className="search-input">
            <Search size={17} />
            <input
              aria-label="Search loaded records"
              placeholder={`Search ${resource.title.toLowerCase()}…`}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <div className="toolbar-meta">
            <span>{visible.length} in view</span>
            <button
              className="icon-button"
              aria-label="Refresh records"
              onClick={() => query.refetch()}
            >
              <RefreshCw
                size={17}
                className={query.isFetching ? "animate-spin" : ""}
              />
            </button>
          </div>
        </div>
        {query.isLoading ? (
          <Spinner />
        ) : query.isError ? (
          <div className="p-5">
            <ErrorBox error={query.error} retry={() => query.refetch()} />
          </div>
        ) : visible.length ? (
          <DataTable
            rows={visible}
            resource={resource}
            onSelect={(r) => {
              setDetailId(r.id);
              setEdit(false);
            }}
          />
        ) : (
          <EmptyState
            title={
              search
                ? "No matching records"
                : `No ${resource.title.toLowerCase()} yet`
            }
            description={
              search
                ? "Search checks the records loaded on this page. Clear the search or load more."
                : resource.editable
                  ? "Create a record to get this part of your farm organised."
                  : "Records appear here as farm operations are completed."
            }
            action={
              resource.editable && !search ? (
                <Button variant="secondary" onClick={() => setShowCreate(true)}>
                  <Plus size={16} />
                  Add the first record
                </Button>
              ) : undefined
            }
          />
        )}
        <footer className="table-footer">
          <span>
            {resource.editable
              ? "Farm configuration"
              : "Activity and calculated records"}{" "}
            · {query.hasNextPage ? "More records available" : "All loaded"}
          </span>
          {query.hasNextPage && (
            <Button
              variant="secondary"
              loading={query.isFetchingNextPage}
              onClick={() => query.fetchNextPage()}
            >
              <ArrowDown size={15} />
              Load more
            </Button>
          )}
        </footer>
      </section>
      {!resource.editable && (
        <p className="below-table-note">
          <SlidersHorizontal size={14} />
          Changes are recorded through the appropriate farm action, keeping the
          history intact.
        </p>
      )}
      {showCreate && (
        <Modal
          title={`Add ${resource.title.toLowerCase().replace(/s$/, "")}`}
          onClose={() => setShowCreate(false)}
          wide
          busy={save.isPending}
        >
          <RecordForm
            resource={resource}
            onSave={(v) =>
              save.mutate(
                { values: v },
                { onSuccess: () => setShowCreate(false) },
              )
            }
            onClose={() => setShowCreate(false)}
            pending={save.isPending}
            error={save.error}
          />
        </Modal>
      )}
      {detailId && (
        <Modal
          title={current ? labelFor(current) : "Record details"}
          onClose={() => {
            setDetailId(undefined);
            setEdit(false);
          }}
          wide
          busy={save.isPending}
        >
          {detail.isLoading ? (
            <Spinner />
          ) : detail.isError ? (
            <ErrorBox error={detail.error} />
          ) : (
            current && (
              <>
                {renderDetail?.(current, resource.key) ? (
                  renderDetail(current, resource.key)
                ) : edit ? (
                  <RecordForm
                    resource={resource}
                    record={current}
                    pending={save.isPending}
                    error={save.error}
                    onSave={(v) =>
                      save.mutate(
                        { id: current.id, values: v },
                        { onSuccess: () => setEdit(false) },
                      )
                    }
                    onClose={() => setEdit(false)}
                  />
                ) : (
                  <>
                    <div className="detail-grid">
                      {Object.entries(current)
                        .filter(
                          ([k]) =>
                            ![
                              "id",
                              "farm",
                              "created_by",
                              "updated_by",
                              "version",
                              "created_at",
                              "updated_at",
                              "payload",
                              "before",
                              "after",
                            ].includes(k),
                        )
                        .map(([k, value]) => (
                          <div key={k}>
                            <dt>{humanize(k)}</dt>
                            <dd>
                              <Value
                                column={k}
                                value={value}
                                relation={resource.relations[k]}
                              />
                            </dd>
                          </div>
                        ))}
                    </div>
                    <p className="record-meta">
                      Record version {current.version ?? "—"}
                    </p>
                    <div className="form-footer">
                      {resource.editable &&
                        !resource.versioned &&
                        current.farm !== null && (
                          <Button
                            onClick={() => {
                              save.reset();
                              setEdit(true);
                            }}
                          >
                            Edit record
                          </Button>
                        )}
                    </div>
                  </>
                )}
              </>
            )
          )}
        </Modal>
      )}
      {command && (
        <Modal title={command.label} onClose={() => setCommand(null)} wide>
          <CommandForm
            command={command}
            api={api}
            onClose={() => setCommand(null)}
            onResult={(data) => {
              setCommand(null);
              setResult(data);
            }}
          />
        </Modal>
      )}
      {result !== null && (
        <Modal title="Action completed" onClose={() => setResult(null)}>
          <Result value={result} />
          <div className="form-footer">
            <Button onClick={() => setResult(null)}>Done</Button>
          </div>
        </Modal>
      )}
    </div>
  );
}
function Result({ value }: { value: unknown }) {
  if (value === null || value === undefined) return <p>Saved successfully.</p>;
  if (Array.isArray(value) && typeof value[1] === "string")
    return (
      <div>
        <p className="form-intro">
          Invitation created. Share this token with the invited person through
          your chosen channel.
        </p>
        <label className="field">
          Invitation token
          <input readOnly value={value[1]} onFocus={(e) => e.target.select()} />
        </label>
      </div>
    );
  if (typeof value === "object") {
    const row = value as Record<string, unknown>;
    return (
      <dl className="detail-grid">
        {Object.entries(row)
          .filter(
            ([k]) =>
              ![
                "id",
                "farm",
                "created_by",
                "updated_by",
                "request_hash",
              ].includes(k),
          )
          .slice(0, 20)
          .map(([k, v]) => (
            <div key={k}>
              <dt>{humanize(k)}</dt>
              <dd>
                <Value column={k} value={v} />
              </dd>
            </div>
          ))}
      </dl>
    );
  }
  return <p>{String(value)}</p>;
}
