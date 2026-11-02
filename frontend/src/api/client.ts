import { useSession } from "@/stores/session";
export const API_BASE = new URL(
  import.meta.env.VITE_API_BASE_URL || "http://127.0.0.1:8000/api/v1",
  window.location.origin,
).href.replace(/\/$/, "");
export class ApiError extends Error {
  constructor(
    public status: number,
    message: string,
    public fields: unknown = {},
    public code = "request_failed",
  ) {
    super(message);
    this.name = "ApiError";
  }
}
let refreshPending: Promise<boolean> | null = null;
function endpoint(path: string) {
  return path.startsWith("http")
    ? path
    : API_BASE + "/" + path.replace(/^\//, "");
}
function trusted(url: string) {
  const target = new URL(url);
  const base = new URL(API_BASE);
  if (
    target.origin !== base.origin ||
    !target.pathname.startsWith(base.pathname + "/")
  )
    throw new ApiError(400, "The server returned an invalid pagination link.");
  return url;
}
export async function refreshSession() {
  if (refreshPending) return refreshPending;
  refreshPending = (async () => {
    const refresh = useSession.getState().refreshToken;
    const generation = useSession.getState().generation;
    if (!refresh) return false;
    try {
      const r = await fetch(API_BASE + "/auth/refresh/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ refresh }),
      });
      if (!r.ok) return false;
      const data = await r.json();
      if (
        useSession.getState().generation !== generation ||
        useSession.getState().refreshToken !== refresh
      )
        return false;
      useSession.getState().setTokens(data.access, data.refresh);
      return true;
    } catch {
      return false;
    }
  })().finally(() => {
    refreshPending = null;
  });
  return refreshPending;
}
export async function apiRequest<T>(
  path: string,
  options: RequestInit & { public?: boolean } = {},
): Promise<T> {
  if (useSession.getState().mode === "demo" && !options.public) {
    const { demoRequest } = await import("@/demo/api");
    return demoRequest<T>(path, options);
  }
  const url = trusted(endpoint(path));
  const send = () => {
    const headers = new Headers(options.headers);
    if (options.body && !(options.body instanceof FormData))
      headers.set("Content-Type", "application/json");
    if (!options.public && useSession.getState().accessToken)
      headers.set(
        "Authorization",
        "Bearer " + useSession.getState().accessToken,
      );
    return fetch(url, { ...options, headers });
  };
  let response: Response;
  try {
    response = await send();
    if (response.status === 401 && !options.public && (await refreshSession()))
      response = await send();
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") throw e;
    throw new ApiError(
      0,
      "Cannot reach the farm server. Check that Django is running and CORS allows this frontend.",
    );
  }
  if (!response.ok) {
    let data: {
      message?: string;
      detail?: string;
      fields?: unknown;
      code?: string;
    } = {};
    try {
      data = await response.json();
    } catch {
      /* non-JSON server error */
    }
    if (response.status === 401 && !options.public) {
      useSession.getState().clear();
    }
    const message =
      response.status === 403
        ? "You do not have permission for this action."
        : response.status === 409
          ? "This record changed or conflicts with another booking. Refresh it and review before trying again."
          : data.message ||
            data.detail ||
            "The request could not be completed.";
    throw new ApiError(response.status, message, data.fields, data.code);
  }
  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
export async function apiDownload(path: string, name: string) {
  if (useSession.getState().mode === "demo")
    throw new ApiError(
      400,
      "Downloads are available when connected to your backend.",
    );
  let token = useSession.getState().accessToken;
  let r = await fetch(trusted(endpoint(path)), {
    headers: { Authorization: "Bearer " + token },
  });
  if (r.status === 401 && (await refreshSession())) {
    token = useSession.getState().accessToken;
    r = await fetch(trusted(endpoint(path)), {
      headers: { Authorization: "Bearer " + token },
    });
  }
  if (!r.ok)
    throw new ApiError(
      r.status,
      "The file could not be downloaded. Check your access.",
    );
  const url = URL.createObjectURL(await r.blob());
  const link = document.createElement("a");
  link.href = url;
  link.download = name;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
