import { SecretCode } from "@/components/SecretCode";
import { Select } from "@/components/forms/Select";
import { usePermissions } from "@/hooks/usePermissions";
import { ownedDrafts } from "@/offline/drafts";
import { ResourceTabs } from "./ResourceTabs";
import { useId } from "react";
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
import { RecordDetails } from "./RecordDetails";
import { DataTable } from "./DataTable";
import { CommandForm } from "./CommandForm";
import { labelFor } from "@/lib/format";
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
  const access = usePermissions();
  const tabId = useId();
  const [params, setParams] = useSearchParams();
  const resource =
    resources.find((r) => r.key === params.get("tab")) || resources[0];
  const canCreate = resource.createCommand
    ? access.canCommand(resource.createCommand)
    : resource.editable && access.resourcePermission(resource.model, "create");
  const canEdit =
    resource.editable && access.resourcePermission(resource.model, "update");
  const [search, setSearch] = useState(params.get("search") || "");
  const [showCreate, setShowCreate] = useState(false);
  const [command, setCommand] = useState<CommandDefinition | null>(null);
  const [detailId, setDetailId] = useState<string | undefined>(
    params.get("record") || undefined,
  );
  const [edit, setEdit] = useState(false);
  const [commandRecord, setCommandRecord] = useState<Row | undefined>();
  const [result, setResult] = useState<unknown>(null);
  useEffect(() => {
    const action = params.get("action");
    if (action)
      setCommand(
        access.canCommand(action)
          ? commands.find((c) => c.key === action) || null
          : null,
      );
  }, [params, commands]);
  useEffect(() => {
    const draft = ownedDrafts().find((d) => d.id === params.get("draft"));
    if (
      draft?.kind === "record" &&
      draft.key === resource.key &&
      (draft.recordId ? canEdit : canCreate)
    ) {
      if (draft.recordId) {
        setDetailId(draft.recordId);
        setEdit(true);
      } else setShowCreate(true);
    }
  }, [params, resource.key]);
  const clearDraftRoute = () => {
    if (!params.has("draft")) return;
    const next = new URLSearchParams(params);
    next.delete("draft");
    next.delete("action");
    next.delete("record");
    setParams(next, { replace: true });
  };
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
    (c) =>
      (!c.resource || c.resource === resource.key) && access.canCommand(c.key),
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
              <Select
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
              </Select>
            )}
            {canCreate && (
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
      <ResourceTabs
        id={tabId}
        title={title}
        resources={resources}
        active={resource.key}
        onSelect={(key) => {
          setParams({ tab: key });
          setSearch("");
          setDetailId(undefined);
          setEdit(false);
        }}
      />
      <section
        key={resource.key}
        className="panel resource-tab-panel"
        id={`${tabId}-panel`}
        role="tabpanel"
        aria-labelledby={`${tabId}-tab-${resource.key}`}
        tabIndex={0}
      >
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
              canCreate && !search ? (
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
      {showCreate && canCreate && (
        <Modal
          title={`Add ${resource.title.toLowerCase().replace(/s$/, "")}`}
          onClose={() => {
            setShowCreate(false);
            clearDraftRoute();
          }}
          wide
          busy={save.isPending}
        >
          <RecordForm
            resource={resource}
            onSave={async (v) => {
              await save.mutateAsync({ values: v });
              setShowCreate(false);
              clearDraftRoute();
            }}
            onClose={() => {
              setShowCreate(false);
              clearDraftRoute();
            }}
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
            clearDraftRoute();
          }}
          wide
          description={
            edit
              ? "Update the record details below."
              : "Review the record, related details and history."
          }
          busy={save.isPending}
        >
          {detail.isLoading ? (
            <Spinner />
          ) : detail.isError ? (
            <ErrorBox error={detail.error} />
          ) : (
            current && (
              <>
                {!edit && renderDetail?.(current, resource.key) ? (
                  renderDetail(current, resource.key)
                ) : edit && canEdit ? (
                  <RecordForm
                    resource={resource}
                    record={current}
                    pending={save.isPending}
                    error={save.error}
                    onSave={async (v) => {
                      await save.mutateAsync({ id: current.id, values: v });
                      setEdit(false);
                      clearDraftRoute();
                    }}
                    onClose={() => setEdit(false)}
                  />
                ) : (
                  <>
                    <RecordDetails record={current} resource={resource} />
                    {resource.key === "members" &&
                      access.canCommand("change_member") && (
                        <div className="form-footer">
                          {["change_member", "remove_member"].map((key) => (
                            <Button
                              key={key}
                              variant="secondary"
                              onClick={() => {
                                setCommandRecord(current);
                                setDetailId(undefined);
                                setCommand(
                                  commands.find((c) => c.key === key) || null,
                                );
                              }}
                            >
                              {key === "change_member"
                                ? "Edit role / access"
                                : "Remove from farm"}
                            </Button>
                          ))}
                        </div>
                      )}
                    <div className="form-footer">
                      {canEdit &&
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
      {command && access.canCommand(command.key) && (
        <Modal
          title={command.label}
          onClose={() => {
            setCommand(null);
            setCommandRecord(undefined);
            clearDraftRoute();
          }}
          wide
        >
          <CommandForm
            command={command}
            record={commandRecord}
            api={api}
            onClose={() => {
              setCommand(null);
              setCommandRecord(undefined);
              clearDraftRoute();
            }}
            onResult={(data) => {
              setCommand(null);
              setCommandRecord(undefined);
              clearDraftRoute();
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
          <SecretCode value={value[1]} />
        </label>
      </div>
    );
  if (typeof value === "object") {
    return <RecordDetails record={value as Row} />;
  }
  return <p>{String(value)}</p>;
}
