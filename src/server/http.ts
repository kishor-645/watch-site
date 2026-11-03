import "server-only";
import { NextResponse, type NextRequest } from "next/server";
import { ZodError, type z } from "zod";
import type { ApiErrorCode, ApiResponse } from "@/lib/types";
import { getCurrentAdmin, type AdminSession } from "./auth/session";
import { DatabaseUnavailableError } from "./db";
import { log } from "./log";

/* ------------------------------------------------------------------ */
/* Responses                                                           */
/* ------------------------------------------------------------------ */

const NO_STORE = { "Cache-Control": "no-store" };

export function ok<T>(data: T, status = 200): NextResponse<ApiResponse<T>> {
  return NextResponse.json({ ok: true, data }, { status, headers: NO_STORE });
}

export function fail(
  status: number,
  code: ApiErrorCode,
  message: string,
  fields?: Record<string, string>,
  headers?: Record<string, string>,
): NextResponse<ApiResponse<never>> {
  return NextResponse.json(
    { ok: false, error: { code, message, ...(fields && { fields }) } },
    { status, headers: { ...NO_STORE, ...headers } },
  );
}

export class ApiError extends Error {
  constructor(
    public status: number,
    public code: ApiErrorCode,
    message: string,
    public fields?: Record<string, string>,
    public headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function zodFields(error: ZodError): Record<string, string> {
  const fields: Record<string, string> = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_";
    fields[key] ??= issue.message;
  }
  return fields;
}

/* ------------------------------------------------------------------ */
/* Request helpers                                                     */
/* ------------------------------------------------------------------ */

const MAX_JSON_BYTES = 256 * 1024;

/** Reads and validates a JSON body. Throws ApiError (400/413/415/422). */
export async function readJson<S extends z.ZodTypeAny>(req: Request, schema: S): Promise<z.output<S>> {
  const type = req.headers.get("content-type") ?? "";
  if (!type.toLowerCase().startsWith("application/json")) {
    throw new ApiError(415, "UNSUPPORTED_MEDIA_TYPE", "Expected application/json");
  }
  const length = Number(req.headers.get("content-length") ?? 0);
  if (length > MAX_JSON_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  const raw = await req.text();
  if (raw.length > MAX_JSON_BYTES) throw new ApiError(413, "PAYLOAD_TOO_LARGE", "Request body is too large");
  let body: unknown;
  try {
    body = JSON.parse(raw);
  } catch {
    throw new ApiError(400, "BAD_REQUEST", "Malformed JSON");
  }
  const result = schema.safeParse(body);
  if (!result.success) {
    throw new ApiError(422, "VALIDATION_ERROR", "Please correct the highlighted fields", zodFields(result.error));
  }
  return result.data;
}

export function clientIp(req: Request): string | null {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]!.trim().slice(0, 64) || null;
  return req.headers.get("x-real-ip")?.slice(0, 64) ?? null;
}

export function userAgent(req: Request): string | null {
  return req.headers.get("user-agent")?.slice(0, 300) ?? null;
}

/** CSRF defence for cookie-authenticated mutations: the request must originate from this site. */
export function isSameOrigin(req: Request): boolean {
  const site = req.headers.get("sec-fetch-site");
  if (site && site !== "same-origin") return false;
  const origin = req.headers.get("origin");
  if (!origin) return site === "same-origin";
  try {
    const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
    return new URL(origin).host === host;
  } catch {
    return false;
  }
}

/* ------------------------------------------------------------------ */
/* Route wrapper                                                       */
/* ------------------------------------------------------------------ */

export interface ApiContext<P> {
  req: NextRequest;
  params: P;
  /** Present when `auth: true`. */
  admin: AdminSession;
  ip: string | null;
  userAgent: string | null;
}

interface ApiOptions {
  /** Require an authenticated admin (default true). */
  auth?: boolean;
  /** Allow while the admin still has to change the initial password (password change, logout, me). */
  allowPendingPasswordChange?: boolean;
}

type RouteContext<P> = { params: Promise<P> };

/**
 * Wraps a Route Handler with: same-origin check on mutations, optional admin auth (signature +
 * session version), forced-password-change gate, and uniform error responses.
 */
export function withApi<P = Record<string, never>>(
  handler: (ctx: ApiContext<P>) => Promise<Response>,
  options: ApiOptions = {},
) {
  const { auth = true, allowPendingPasswordChange = false } = options;
  return async (req: NextRequest, context: RouteContext<P>): Promise<Response> => {
    try {
      const mutating = !["GET", "HEAD", "OPTIONS"].includes(req.method);
      if (mutating && !isSameOrigin(req)) return fail(403, "FORBIDDEN", "Cross-site request blocked");

      let admin: AdminSession | null = null;
      if (auth) {
        admin = await getCurrentAdmin();
        if (!admin) return fail(401, "UNAUTHORIZED", "Please sign in again");
        if (admin.mustChangePassword && !allowPendingPasswordChange) {
          return fail(403, "PASSWORD_CHANGE_REQUIRED", "Change your password to continue");
        }
      }

      const params = (await context?.params) ?? ({} as P);
      return await handler({ req, params, admin: admin as AdminSession, ip: clientIp(req), userAgent: userAgent(req) });
    } catch (error) {
      if (error instanceof ApiError) return fail(error.status, error.code, error.message, error.fields, error.headers);
      if (error instanceof ZodError) {
        return fail(422, "VALIDATION_ERROR", "Please correct the highlighted fields", zodFields(error));
      }
      if (error instanceof DatabaseUnavailableError) {
        return fail(503, "SERVICE_UNAVAILABLE", "The service is temporarily unavailable. Please try again.");
      }
      log.error("api.unhandled_error", { method: req.method, path: req.nextUrl.pathname, error });
      return fail(500, "INTERNAL_ERROR", "Something went wrong. Please try again.");
    }
  };
}
