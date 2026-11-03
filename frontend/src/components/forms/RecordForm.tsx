import { restorableDraft } from "@/offline/drafts";
import { useOfflineForm } from "@/offline/useOfflineForm";
import { OfflineFormNotice } from "@/offline/OfflineFormNotice";
import { useState } from "react";
import type { ResourceDefinition, Row } from "@/types";
import { Fields } from "./Fields";
import { Button, ErrorBox } from "@/components/ui";
import { cleanValues, initialValues } from "@/lib/forms";
export function RecordForm({
  resource,
  record,
  onSave,
  onClose,
  pending,
  error,
}: {
  resource: ResourceDefinition;
  record?: Row;
  onSave: (v: Record<string, unknown>) => Promise<void>;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
  const [values, setValues] = useState(() =>
    initialValues(resource.fields, {
      ...record,
      ...restorableDraft("record", resource.key, record?.id)?.values,
    }),
  );
  const [localError, setLocalError] = useState<unknown>(null);
  const offline = useOfflineForm({
    kind: "record",
    key: resource.key,
    label: resource.title,
    values,
    error,
    recordId: record?.id,
    version: record?.version,
  });
  const basic = resource.fields.filter(
    (f) => !f.advanced && !(record && f.immutable),
  );
  const advanced = resource.fields.filter(
    (f) => f.advanced && !(record && f.immutable),
  );
  return (
    <form
      onSubmit={async (e) => {
        e.preventDefault();
        if (offline.browserOffline) {
          offline.save();
          return;
        }
        let payload: Record<string, unknown>;
        try {
          payload = cleanValues(resource.fields, values, Boolean(record));
          if (record)
            payload.version =
              restorableDraft("record", resource.key, record.id)?.version ??
              record.version;
          setLocalError(null);
        } catch {
          setLocalError(
            new Error("Check the additional details: JSON must be valid."),
          );
          return;
        }
        try {
          await onSave(payload);
          offline.complete();
        } catch {
          /* Mutation error is shown below; connection failures also create a local draft. */
        }
      }}
    >
      <OfflineFormNotice state={offline} />
      <fieldset disabled={pending}>
        <Fields fields={basic} values={values} onChange={setValues} />
        {advanced.length > 0 && (
          <details className="advanced">
            <summary>Additional details</summary>
            <Fields fields={advanced} values={values} onChange={setValues} />
          </details>
        )}
      </fieldset>
      {Boolean(error || localError) && <ErrorBox error={error || localError} />}
      <footer className="form-footer">
        <Button variant="secondary" onClick={onClose} disabled={pending}>
          Cancel
        </Button>
        <Button type="submit" loading={pending}>
          {offline.browserOffline
            ? "Save offline"
            : record
              ? "Save changes"
              : "Create record"}
        </Button>
      </footer>
    </form>
  );
}
