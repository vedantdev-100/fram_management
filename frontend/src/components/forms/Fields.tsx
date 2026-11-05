import { Select } from "@/components/forms/Select";
import { InfoHint } from "@/components/InfoHint";
import { fieldHelp } from "@/lib/fieldHelp";
import { initialValues } from "@/lib/forms";
import { useId } from "react";
import { Plus, X } from "lucide-react";
import type { Field } from "@/types";
import { ReferencePicker } from "./ReferencePicker";
import { Button } from "@/components/ui";
export function Fields({
  fields,
  values,
  onChange,
  prefix = "",
}: {
  fields: Field[];
  values: Record<string, unknown>;
  onChange: (values: Record<string, unknown>) => void;
  prefix?: string;
}) {
  return (
    <div className="form-grid">
      {fields
        .filter(
          (f) => !f.when || f.when.in.includes(String(values[f.when.field])),
        )
        .map((field) => (
          <FieldInput
            key={field.name}
            field={field}
            value={values[field.name]}
            onChange={(value) => onChange({ ...values, [field.name]: value })}
            prefix={prefix}
            context={values}
          />
        ))}
    </div>
  );
}
function FieldInput({
  field: f,
  value,
  onChange,
  prefix,
  context,
}: {
  field: Field;
  value: unknown;
  onChange: (v: unknown) => void;
  prefix: string;
  context: Record<string, unknown>;
}) {
  const uid = useId();
  const id = prefix + uid;
  let input;
  if (f.type === "array") {
    const rows = (value || []) as Record<string, unknown>[];
    return (
      <section className="field-group form-span">
        <div className="field-group-heading">
          <div className="field-label-row">
            <h3>{f.label}</h3>
            <InfoHint label={f.label} description={fieldHelp(f)} />
          </div>
          <Button
            variant="secondary"
            onClick={() => onChange([...rows, initialValues(f.fields || [])])}
          >
            <Plus size={15} />
            Add row
          </Button>
        </div>
        {rows.map((row, i) => (
          <div className="array-row" key={i}>
            <div className="array-row-top">
              <span>
                {f.label} {i + 1}
              </span>
              <button
                type="button"
                className="icon-button"
                aria-label={`Remove ${f.label} ${i + 1}`}
                onClick={() => onChange(rows.filter((_, n) => n !== i))}
              >
                <X size={16} />
              </button>
            </div>
            <Fields
              fields={f.fields || []}
              values={row}
              onChange={(next) =>
                onChange(rows.map((r, n) => (n === i ? next : r)))
              }
              prefix={id + i}
            />
          </div>
        ))}
        {f.required && rows.length === 0 && (
          <p className="field-help">Add at least one row.</p>
        )}
      </section>
    );
  }
  if (f.type === "object")
    return (
      <section className="field-group form-span">
        <div className="field-label-row">
          <h3>{f.label}</h3>
          <InfoHint label={f.label} description={fieldHelp(f)} />
        </div>
        <Fields
          fields={f.fields || []}
          values={(value || {}) as Record<string, unknown>}
          onChange={onChange}
          prefix={id}
        />
      </section>
    );
  if (f.type === "reference")
    input = (
      <ReferencePicker
        id={id}
        resource={
          f.resourceField
            ? String(context[f.resourceField] || "units")
            : f.resource!
        }
        value={String(value || "")}
        onChange={onChange}
        required={f.required}
      />
    );
  else if (f.type === "boolean")
    return (
      <div className="checkbox-help-row">
        <label className="checkbox-field" htmlFor={id}>
          <input
            id={id}
            type="checkbox"
            checked={Boolean(value ?? f.default ?? false)}
            onChange={(e) => onChange(e.target.checked)}
          />
          <span>
            {f.label}
            {f.help && <small>{f.help}</small>}
          </span>
        </label>
        <InfoHint label={f.label} description={fieldHelp(f)} />
      </div>
    );
  else if (f.type === "select")
    input = (
      <Select
        id={id}
        value={String(value ?? "")}
        required={f.required}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">Choose {f.label.toLowerCase()}</option>
        {f.options?.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </Select>
    );
  else if (f.type === "textarea" || f.type === "json")
    input = (
      <textarea
        id={id}
        rows={f.type === "json" ? 5 : 3}
        className={f.type === "json" ? "font-mono text-xs" : ""}
        value={
          typeof value === "object"
            ? JSON.stringify(value, null, 2)
            : String(value ?? "")
        }
        required={f.required}
        spellCheck={f.type !== "json"}
        onChange={(e) => onChange(e.target.value)}
        placeholder={f.type === "json" ? "{}" : undefined}
      />
    );
  else
    input = (
      <input
        id={id}
        type={f.type}
        value={String(value ?? "")}
        required={f.required}
        step={f.step || "any"}
        onChange={(e) => onChange(e.target.value)}
        autoComplete="off"
      />
    );
  return (
    <div
      className={
        "field " + (["textarea", "json"].includes(f.type) ? "form-span" : "")
      }
    >
      <div className="field-label-row">
        <label htmlFor={id}>
          {f.label}
          {f.required && (
            <span className="required" aria-label="required">
              {" "}
              *
            </span>
          )}
        </label>
        <InfoHint label={f.label} description={fieldHelp(f)} />
      </div>
      {input}
      {f.help && <p className="field-help">{f.help}</p>}
    </div>
  );
}
