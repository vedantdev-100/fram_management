import { useQuery } from "@tanstack/react-query";
import { allRecords } from "@/api/resources";
import { useWorkspace } from "@/stores/workspace";
import { labelFor } from "@/lib/format";
export function useOptions(resource: string) {
  const farm = useWorkspace((s) => s.farm?.id) || "";
  return useQuery({
    queryKey: ["farm", farm, "lookup", resource],
    queryFn: ({ signal }) => allRecords(farm, resource, signal),
    enabled: !!farm && !!resource,
    staleTime: 60000,
  });
}
export function ReferencePicker({
  resource,
  value,
  onChange,
  required,
  id,
  disabled,
}: {
  resource: string;
  value: string;
  onChange: (value: string) => void;
  required?: boolean;
  id: string;
  disabled?: boolean;
}) {
  const q = useOptions(resource);
  return (
    <div>
      <select
        id={id}
        value={value || ""}
        required={required}
        disabled={disabled || q.isLoading}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">
          {q.isLoading
            ? "Loading choices…"
            : `Select ${resource.replace(/-/g, " ")}`}
        </option>
        {q.data?.rows.map((r) => (
          <option key={r.id} value={r.id}>
            {labelFor(r)}
            {r.farm === null ? " · shared" : ""}
          </option>
        ))}
      </select>
      {q.isError && (
        <p className="field-error">
          Choices could not be loaded. Check your access to this module.
        </p>
      )}
      {q.data?.truncated && (
        <p className="field-help">
          The first 2,500 choices are shown. Narrow the farm’s configuration
          before selecting.
        </p>
      )}
    </div>
  );
}
export function ReferenceLabel({
  resource,
  id,
}: {
  resource: string;
  id: unknown;
}) {
  const q = useOptions(resource);
  const row = q.data?.rows.find((r) => r.id === id);
  return (
    <span title={String(id ?? "")}>
      {row ? labelFor(row) : id ? "Linked record" : "—"}
    </span>
  );
}
