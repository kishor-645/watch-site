import type { ApiError, ApiErrorCode, ApiResponse } from "@/lib/types";

/**
 * Tiny typed client for the admin JSON API (see docs/API_DOCUMENTATION.md).
 * Never throws: network/parse failures are turned into a friendly `ApiError`.
 */

export type ApiResult<T> = ApiResponse<T> & {
  /** HTTP status (0 when the request never reached the server). */
  status: number;
  /** Seconds from the `Retry-After` header (429 responses), if present. */
  retryAfter: number | null;
};

export interface RequestOptions {
  /** Navigate to the login / account page on UNAUTHORIZED / PASSWORD_CHANGE_REQUIRED. Default true. */
  handleAuth?: boolean;
  signal?: AbortSignal;
}

const FALLBACK_MESSAGES: Partial<Record<number, string>> = {
  400: "The request was not accepted. Please check your input.",
  401: "Your session has ended. Please sign in again.",
  403: "This action is not allowed.",
  404: "Not found — it may have been deleted.",
  409: "This conflicts with an existing record.",
  413: "The data is too large to save.",
  422: "Please correct the highlighted fields.",
  429: "Too many attempts. Please wait and try again.",
  503: "The service is temporarily unavailable. Please try again shortly.",
};

const STATUS_CODES: Partial<Record<number, ApiErrorCode>> = {
  400: "BAD_REQUEST",
  401: "UNAUTHORIZED",
  403: "FORBIDDEN",
  404: "NOT_FOUND",
  409: "CONFLICT",
  413: "PAYLOAD_TOO_LARGE",
  415: "UNSUPPORTED_MEDIA_TYPE",
  422: "VALIDATION_ERROR",
  429: "RATE_LIMITED",
  503: "SERVICE_UNAVAILABLE",
};

export const NETWORK_ERROR_MESSAGE = "Could not reach the server. Check your connection and try again.";

function fail<T>(error: ApiError, status: number, retryAfter: number | null = null): ApiResult<T> {
  return { ok: false, error, status, retryAfter };
}

function parseRetryAfter(value: string | null): number | null {
  if (!value) return null;
  const n = Number(value);
  if (Number.isFinite(n) && n >= 0) return Math.ceil(n);
  const date = Date.parse(value);
  return Number.isNaN(date) ? null : Math.max(0, Math.ceil((date - Date.now()) / 1000));
}

function isApiResponse(value: unknown): value is ApiResponse<unknown> {
  if (typeof value !== "object" || value === null || !("ok" in value)) return false;
  const v = value as { ok: unknown; error?: unknown };
  return v.ok === true || (v.ok === false && typeof v.error === "object" && v.error !== null);
}

let redirecting = false;

/** Handles the auth-related error codes globally. Returns true when a navigation was started. */
export function handleAuthError(code: ApiErrorCode): boolean {
  if (typeof window === "undefined" || redirecting) return redirecting;
  if (code === "UNAUTHORIZED") {
    redirecting = true;
    window.location.assign("/admin/login");
    return true;
  }
  if (code === "PASSWORD_CHANGE_REQUIRED") {
    if (window.location.pathname !== "/admin/account") {
      redirecting = true;
      window.location.assign("/admin/account?required=1");
    }
    return true;
  }
  return false;
}

/** Converts a non-OK `Response` into an `ApiResult` failure. */
export async function failureFromResponse<T>(res: Response): Promise<ApiResult<T>> {
  const retryAfter = parseRetryAfter(res.headers.get("Retry-After"));
  let body: unknown = null;
  try {
    body = await res.json();
  } catch {
    /* non-JSON error page */
  }
  if (isApiResponse(body) && !body.ok) return fail<T>(body.error, res.status, retryAfter);
  return fail<T>(
    {
      code: STATUS_CODES[res.status] ?? "INTERNAL_ERROR",
      message: FALLBACK_MESSAGES[res.status] ?? "Something went wrong. Please try again.",
    },
    res.status,
    retryAfter,
  );
}

export async function apiRequest<T>(
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE",
  url: string,
  body?: unknown,
  { handleAuth = true, signal }: RequestOptions = {},
): Promise<ApiResult<T>> {
  let res: Response;
  try {
    res = await fetch(url, {
      method,
      headers: body === undefined ? undefined : { "Content-Type": "application/json" },
      body: body === undefined ? undefined : JSON.stringify(body),
      credentials: "same-origin",
      cache: "no-store",
      signal,
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "AbortError") {
      return fail<T>({ code: "BAD_REQUEST", message: "Request cancelled" }, 0);
    }
    return fail<T>({ code: "SERVICE_UNAVAILABLE", message: NETWORK_ERROR_MESSAGE }, 0);
  }

  let result: ApiResult<T>;
  if (res.ok) {
    let json: unknown;
    try {
      json = await res.json();
    } catch {
      return fail<T>({ code: "INTERNAL_ERROR", message: "Unexpected response from the server." }, res.status);
    }
    if (isApiResponse(json)) {
      result = json.ok
        ? { ok: true, data: json.data as T, status: res.status, retryAfter: null }
        : fail<T>(json.error, res.status);
    } else {
      return fail<T>({ code: "INTERNAL_ERROR", message: "Unexpected response from the server." }, res.status);
    }
  } else {
    result = await failureFromResponse<T>(res);
  }

  if (!result.ok && handleAuth) handleAuthError(result.error.code);
  return result;
}

export const api = {
  get: <T>(url: string, opts?: RequestOptions) => apiRequest<T>("GET", url, undefined, opts),
  post: <T>(url: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>("POST", url, body ?? {}, opts),
  put: <T>(url: string, body: unknown, opts?: RequestOptions) => apiRequest<T>("PUT", url, body, opts),
  patch: <T>(url: string, body: unknown, opts?: RequestOptions) => apiRequest<T>("PATCH", url, body, opts),
  // Mutations always send a JSON body ({} when empty) so content-type checks never trip.
  delete: <T>(url: string, body?: unknown, opts?: RequestOptions) => apiRequest<T>("DELETE", url, body ?? {}, opts),
};

/** Human-friendly message for a failed result (auth redirects get a neutral message). */
export function errorMessage(error: ApiError): string {
  if (error.code === "UNAUTHORIZED") return "Your session has ended. Redirecting to sign in…";
  if (error.code === "PASSWORD_CHANGE_REQUIRED") return "Please change your password first.";
  return error.message || "Something went wrong. Please try again.";
}
