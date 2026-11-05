import { usePermissions } from "@/hooks/usePermissions";
import {
  DetailSection,
  DetailTable,
} from "@/components/workspace/RecordDetails";
import { useState } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { Play, Check, Send, CalendarClock, XCircle } from "lucide-react";
import type { Row } from "@/types";
import { api } from "../api";
import { queryClient, refreshFarmQueries } from "@/api/queryClient";
import { useWorkspace } from "@/stores/workspace";
import { Button, Spinner, ErrorBox, Modal } from "@/components/ui";
import { ReferenceLabel } from "@/components/forms/ReferencePicker";
import { money, dateTime, humanize } from "@/lib/format";
import { notify } from "@/stores/toasts";
export function EventDetail({ record }: { record: Row }) {
  const access = usePermissions();
  const canRecord =
    access.has("events.event.submit") || access.has("events.event.confirm");
  const farm = useWorkspace((s) => s.farm)!;
  const [actuals, setActuals] = useState<Record<string, string>>({});
  const [cancel, setCancel] = useState(false);
  const [override, setOverride] = useState("");
  const query = useQuery({
    queryKey: ["farm", farm.id, "event-lines", record.id],
    queryFn: () => api.list(farm.id, "sub-events", { event: record.id }),
  });
  const mutation = useMutation({
    mutationFn: async (command: string) => {
      const corrections = Object.fromEntries(
        Object.entries(actuals)
          .filter(([, v]) => v !== "")
          .map(([id, qty]) => [id, { actual_qty: qty }]),
      );
      return api.command(farm.id, command, {
        event_id: record.id,
        version: record.version,
        ...(["submit_event", "confirm_event"].includes(command)
          ? { corrections }
          : {}),
        ...(override ? { override_reason: override } : {}),
      });
    },
    onSuccess: async (data) => {
      queryClient.setQueryData(["farm", farm.id, "events", record.id], data);
      await refreshFarmQueries();
      setCancel(false);
      notify("Work record updated");
    },
  });
  const state = String(record.status);
  return (
    <>
      <div className="event-stepper">
        {["planned", "in_progress", "done"].map((s, i) => (
          <div className={state === s ? "active" : ""} key={s}>
            <span>{s === "done" ? <Check size={14} /> : i + 1}</span>
            {humanize(s)}
          </div>
        ))}
      </div>
      <DetailSection title="Work summary">
        <DetailTable
          entries={[
            ["status", state],
            ["planned_start", record.planned_start],
            ["planned_end", record.planned_end],
            [
              "estimated_cost",
              money(record.planned_cost_total, farm.currency_code),
            ],
            [
              "recorded_cost",
              state === "done"
                ? money(record.actual_cost_total, farm.currency_code)
                : "After confirmation",
            ],
          ]}
        />
      </DetailSection>
      <h3 className="section-heading">Resources and actuals</h3>
      <p className="form-intro">
        Planned quantities are used unless you record a correction. Money and
        stock change only on confirmation.
      </p>
      {query.isLoading ? (
        <Spinner />
      ) : query.isError ? (
        <ErrorBox error={query.error} />
      ) : (
        <div>
          <div
            className="detail-table-scroll"
            role="region"
            aria-label="Work resource quantities"
            tabIndex={0}
          >
            <table className="detail-items-table work-actuals-table">
              <caption className="sr-only">
                Resources and actual quantities
              </caption>
              <thead>
                <tr>
                  <th scope="col">Resource</th>
                  <th scope="col">Activity</th>
                  <th scope="col">Unit</th>
                  <th scope="col">Planned</th>
                  <th scope="col">Actual</th>
                </tr>
              </thead>
              <tbody>
                {query.data?.results.map((line, index) => (
                  <tr key={line.id}>
                    <th scope="row">
                      <ReferenceLabel resource="assets" id={line.asset} />
                    </th>
                    <td>{humanize(line.kind)}</td>
                    <td>
                      <ReferenceLabel resource="units" id={line.qty_unit} />
                    </td>
                    <td className="tabular-nums">
                      {String(line.planned_qty ?? "—")}
                    </td>
                    <td>
                      {state === "in_progress" && canRecord ? (
                        <input
                          aria-label={`Actual quantity for resource ${index + 1}`}
                          type="number"
                          step="any"
                          value={
                            actuals[line.id] ??
                            String(line.actual_qty ?? line.planned_qty ?? "")
                          }
                          onChange={(e) =>
                            setActuals({
                              ...actuals,
                              [line.id]: e.target.value,
                            })
                          }
                        />
                      ) : (
                        <span className="tabular-nums">
                          {String(
                            line.actual_qty ??
                              (state === "done" ? "—" : "Not recorded"),
                          )}
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {!query.data?.results.length && (
            <p className="detail-note muted">
              No resources recorded for this work.
            </p>
          )}
          {query.data?.next && (
            <p className="field-help">
              Only the first 50 lines are shown. Unchanged remaining lines keep
              their planned actuals.
            </p>
          )}
        </div>
      )}
      {record.submitted_at && state !== "done" && (
        <p className="success-note">
          Actuals submitted on {dateTime(record.submitted_at, farm.timezone)}.
          Awaiting confirmation.
        </p>
      )}
      {mutation.error && (
        <>
          <ErrorBox error={mutation.error} />
          {access.has("compliance.compliance.override") && (
            <details className="advanced">
              <summary>Authorised safety override</summary>
              <label className="field">
                Override reason
                <textarea
                  value={override}
                  onChange={(e) => setOverride(e.target.value)}
                  placeholder="Only authorised members may override a blocking safety check."
                />
              </label>
            </details>
          )}
        </>
      )}
      <footer className="form-footer">
        {["draft", "planned", "in_progress"].includes(state) &&
          access.has("events.event.cancel") && (
            <Button
              variant="ghost"
              onClick={() => setCancel(true)}
              disabled={mutation.isPending}
            >
              <XCircle size={16} />
              Cancel work
            </Button>
          )}
        {state === "draft" && access.has("events.event.plan") && (
          <Button
            loading={mutation.isPending}
            onClick={() => mutation.mutate("plan_event")}
          >
            <CalendarClock size={16} />
            Commit plan
          </Button>
        )}
        {state === "planned" && access.has("events.event.start") && (
          <Button
            loading={mutation.isPending}
            onClick={() => mutation.mutate("start_event")}
          >
            <Play size={16} />
            Start work
          </Button>
        )}
        {state === "in_progress" && (
          <>
            {access.has("events.event.submit") && (
              <Button
                variant="secondary"
                loading={mutation.isPending}
                onClick={() => mutation.mutate("submit_event")}
              >
                <Send size={16} />
                Submit actuals
              </Button>
            )}
            {access.has("events.event.confirm") && (
              <Button
                loading={mutation.isPending}
                onClick={() => mutation.mutate("confirm_event")}
              >
                <Check size={16} />
                Confirm completed work
              </Button>
            )}
          </>
        )}
        {state === "done" && (
          <p className="muted text-sm">
            Confirmed history is kept. Use a correction action to amend it.
          </p>
        )}
      </footer>
      {cancel && (
        <Modal
          title="Cancel this work?"
          onClose={() => setCancel(false)}
          busy={mutation.isPending}
        >
          <p className="form-intro">
            This will cancel the operation and release its reservations.
            Completed work cannot be cancelled.
          </p>
          <div className="form-footer">
            <Button variant="secondary" onClick={() => setCancel(false)}>
              Keep work
            </Button>
            <Button
              variant="danger"
              loading={mutation.isPending}
              onClick={() => mutation.mutate("cancel_event")}
            >
              Cancel operation
            </Button>
          </div>
        </Modal>
      )}
    </>
  );
}
