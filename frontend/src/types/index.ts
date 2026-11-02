export type Row = {
  id: string;
  version?: number;
  created_at?: string;
  [key: string]: unknown;
};
export interface Page<T = Row> {
  results: T[];
  next: string | null;
  previous: string | null;
}
export interface Membership {
  farm_id: string;
  farm__name: string;
  role__code: string;
}
export interface User {
  id: string;
  email: string;
  full_name: string;
  memberships: Membership[];
}
export interface Farm extends Row {
  name: string;
  slug: string;
  currency_code: string;
  timezone: string;
}
export interface Field {
  name: string;
  label: string;
  type:
    | "text"
    | "textarea"
    | "number"
    | "select"
    | "reference"
    | "boolean"
    | "date"
    | "datetime-local"
    | "json"
    | "object"
    | "array";
  required?: boolean;
  resource?: string;
  resourceField?: string;
  options?: { value: string; label: string }[];
  fields?: Field[];
  default?: unknown;
  help?: string;
  advanced?: boolean;
  step?: string;
  when?: { field: string; in: string[] };
  nullable?: boolean;
  immutable?: boolean;
}
export interface ResourceDefinition {
  key: string;
  title: string;
  model: string;
  editable: boolean;
  versioned?: boolean;
  createCommand?: string;
  columns: string[];
  fields: Field[];
  relations: Record<string, string>;
}
export interface CommandDefinition {
  key: string;
  label: string;
  description: string;
  fields: Field[];
  resource?: string;
  initial?: Record<string, unknown> | (() => Record<string, unknown>);
  idempotent?: boolean;
  build?: (values: Record<string, unknown>) => Record<string, unknown>;
}
export interface ModuleApi {
  list: (
    farm: string,
    resource: string,
    params?: Record<string, string>,
    signal?: AbortSignal,
  ) => Promise<Page>;
  get: (farm: string, resource: string, id: string) => Promise<Row>;
  create: (farm: string, resource: string, body: unknown) => Promise<Row>;
  patch: (
    farm: string,
    resource: string,
    id: string,
    body: unknown,
  ) => Promise<Row>;
  command: (farm: string, command: string, body: unknown) => Promise<unknown>;
}
