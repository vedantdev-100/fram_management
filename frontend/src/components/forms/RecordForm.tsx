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
  onSave: (v: Record<string, unknown>) => void;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
  const [values, setValues] = useState(() =>
    initialValues(resource.fields, record),
  );
  const [localError, setLocalError] = useState<unknown>(null);
  const basic = resource.fields.filter(
    (f) => !f.advanced && !(record && f.immutable),
  );
  const advanced = resource.fields.filter(
    (f) => f.advanced && !(record && f.immutable),
  );
  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        try {
          const v = cleanValues(resource.fields, values, Boolean(record));
          if (record) v.version = record.version;
          onSave(v);
        } catch {
          setLocalError(
            new Error("Check the additional details: JSON must be valid."),
          );
        }
      }}
    >
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
          {record ? "Save changes" : "Create record"}
        </Button>
      </footer>
    </form>
  );
}
