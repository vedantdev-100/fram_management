import type { Field } from "@/types";
export function initialValues(
  fields: Field[],
  record?: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    const raw = record?.[f.name] ?? f.default;
    const val = typeof raw === "function" ? raw() : raw;
    if (val !== undefined && val !== null)
      out[f.name] =
        f.type === "datetime-local"
          ? toLocal(String(val))
          : f.type === "object"
            ? initialValues(f.fields || [], val as Record<string, unknown>)
            : f.type === "array"
              ? (val as Record<string, unknown>[]).map((row) =>
                  initialValues(f.fields || [], row),
                )
              : val;
  }
  return out;
}
function toLocal(s: string) {
  const d = new Date(s);
  return Number.isNaN(d.getTime())
    ? ""
    : new Date(d.getTime() - d.getTimezoneOffset() * 60000)
        .toISOString()
        .slice(0, 16);
}
export function cleanValues(
  fields: Field[],
  values: Record<string, unknown>,
  includeEmpty = false,
): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const f of fields) {
    if (f.when && !f.when.in.includes(String(values[f.when.field]))) continue;
    let val = values[f.name];
    if (val === undefined) continue;
    if (val === null || val === "") {
      if (includeEmpty && f.nullable) out[f.name] = null;
      else if (includeEmpty && ["text", "textarea"].includes(f.type))
        out[f.name] = "";
      continue;
    }
    if (f.type === "datetime-local") val = new Date(String(val)).toISOString();
    if (f.type === "json" && typeof val === "string") val = JSON.parse(val);
    if (f.type === "object")
      val = cleanValues(
        f.fields || [],
        val as Record<string, unknown>,
        includeEmpty,
      );
    if (f.type === "array")
      val = (val as Record<string, unknown>[]).map((v) =>
        cleanValues(f.fields || [], v, includeEmpty),
      );
    if (f.type === "number" && f.step === "1") val = Number(val);
    out[f.name] = val;
  }
  return out;
}
