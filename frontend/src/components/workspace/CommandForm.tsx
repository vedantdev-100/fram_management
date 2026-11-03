import { restorableDraft } from "@/offline/drafts";
import { useOfflineForm } from "@/offline/useOfflineForm";
import { OfflineFormNotice } from "@/offline/OfflineFormNotice";
import { uuid } from "@/lib/uuid";
import { useEffect } from "react";
import { useOptions } from "@/components/forms/ReferencePicker";
import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import type { CommandDefinition, ModuleApi, Row } from "@/types";
import { useWorkspace } from "@/stores/workspace";
import { Fields } from "@/components/forms/Fields";
import { Button, ErrorBox } from "@/components/ui";
import { cleanValues, initialValues } from "@/lib/forms";
import { refreshFarmQueries } from "@/api/queryClient";
import { notify } from "@/stores/toasts";
export function CommandForm({
  command,
  api,
  record,
  onClose,
  onResult,
}: {
  command: CommandDefinition;
  api: ModuleApi;
  record?: Row;
  onClose: () => void;
  onResult?: (data: unknown) => void;
}) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  const [values, setValues] = useState<Record<string, unknown>>(() => ({
    ...initialValues(command.fields),
    ...(typeof command.initial === "function"
      ? command.initial()
      : command.initial),
    ...(record
      ? {
          event_id: record.id,
          block_id: record.id,
          cycle_id: record.id,
          scenario_id: record.id,
          version: record.version,
        }
      : {}),
    client_uuid: uuid(),
    ...restorableDraft("command", command.key)?.values,
  }));
  const [localError, setLocalError] = useState<unknown>(null);
  const primary = command.fields.find(
    (f) =>
      f.type === "reference" &&
      ["event_id", "block_id", "cycle_id", "scenario_id", "member_id"].includes(
        f.name,
      ),
  );
  const options = useOptions(primary?.resource || "");
  const selected = primary ? values[primary.name] : undefined;
  const latest = options.data?.rows.find((r) => r.id === selected);
  useEffect(() => {
    if (
      !restorableDraft("command", command.key) &&
      latest?.version !== undefined &&
      command.fields.some((f) => f.name === "version")
    )
      setValues((v) => ({ ...v, version: latest.version }));
  }, [latest?.version, selected, command.fields]);
  const mutation = useMutation({
    networkMode: "always",
    mutationFn: (v: Record<string, unknown>) =>
      api.command(farm, command.key, v),
    onSuccess: (data) => {
      offline.complete();
      void refreshFarmQueries();
      notify("Action completed");
      if (onResult) onResult(data);
      else onClose();
    },
  });
  const offline = useOfflineForm({
    kind: "command",
    key: command.key,
    label: command.label,
    values,
    error: mutation.error,
  });
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (offline.browserOffline) {
          offline.save();
          return;
        }
        try {
          const clean = cleanValues(command.fields, values);
          if (command.idempotent) clean.client_uuid = values.client_uuid;
          const payload = command.build ? command.build(clean) : clean;
          if (
            values.client_uuid &&
            !("client_uuid" in payload) &&
            ["ledger_transfer", "duplicate_event"].includes(command.key)
          )
            payload.client_uuid = values.client_uuid;
          mutation.mutate(payload);
        } catch {
          setLocalError(
            new Error(
              "Check the form and any structured values before continuing.",
            ),
          );
        }
      }}
    >
      <OfflineFormNotice state={offline} />
      <p className="form-intro">{command.description}</p>
      <fieldset disabled={mutation.isPending}>
        <Fields fields={command.fields} values={values} onChange={setValues} />
      </fieldset>
      {Boolean(mutation.error || localError) && (
        <ErrorBox error={mutation.error || localError} />
      )}
      <footer className="form-footer">
        <Button
          variant="secondary"
          onClick={onClose}
          disabled={mutation.isPending}
        >
          Cancel
        </Button>
        <Button type="submit" loading={mutation.isPending}>
          {offline.browserOffline ? "Save offline" : command.label}
        </Button>
      </footer>
    </form>
  );
}
