export const humanize = (value: unknown) =>
  String(value ?? "")
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
export const shortDate = (value: unknown) =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
      }).format(new Date(String(value)))
    : "—";
export const dateTime = (value: unknown, timezone = "Asia/Kolkata") =>
  value
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        hour: "numeric",
        minute: "2-digit",
        timeZone: timezone,
      }).format(new Date(String(value)))
    : "—";
export const money = (value: unknown, currency = "INR") =>
  value === null || value === undefined || value === ""
    ? "—"
    : new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency,
        maximumFractionDigits: 0,
      }).format(Number(value));
export const number = (value: unknown) =>
  value === null || value === undefined || value === ""
    ? "—"
    : new Intl.NumberFormat("en-IN", { maximumFractionDigits: 2 }).format(
        Number(value),
      );
export const initials = (name: string) =>
  name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
export const today = () => new Date().toISOString().slice(0, 10);
export const localDateTime = (value: unknown) => {
  if (!value) return "";
  const d = new Date(String(value));
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000)
    .toISOString()
    .slice(0, 16);
};
export const labelFor = (row: Record<string, unknown>) =>
  String(
    row.member_name ||
      row.name ||
      row.title ||
      row.original_name ||
      row.code ||
      row.lot_code ||
      row.email ||
      row.command_name ||
      row.id ||
      "Record",
  );
