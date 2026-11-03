import { NextRequest } from "next/server";
import type { ApiResponse } from "@/lib/types";

export const ORIGIN = "http://localhost:3000";

export interface RequestOptions {
  body?: unknown;
  /** Defaults to "203.0.113.1". */
  ip?: string;
  /** Simulate a request from another site (fails the CSRF check). */
  crossSite?: boolean;
  headers?: Record<string, string>;
}

/** Builds a same-origin NextRequest as a browser on this site would send it. */
export function buildRequest(method: string, path: string, opts: RequestOptions = {}): NextRequest {
  const headers: Record<string, string> = {
    host: "localhost:3000",
    origin: opts.crossSite ? "https://evil.example" : ORIGIN,
    "sec-fetch-site": opts.crossSite ? "cross-site" : "same-origin",
    "x-forwarded-for": opts.ip ?? "203.0.113.1",
    "user-agent": "vitest",
    ...(opts.body !== undefined && { "content-type": "application/json" }),
    ...opts.headers,
  };
  return new NextRequest(new URL(path, ORIGIN), {
    method,
    headers,
    body: opts.body === undefined ? undefined : JSON.stringify(opts.body),
  });
}

type Handler = (req: NextRequest, ctx: { params: Promise<never> }) => Promise<Response>;

export interface ApiResult<T> {
  status: number;
  headers: Headers;
  json: ApiResponse<T>;
  /** `json.data` — throws if the response was an error. */
  data: T;
}

/** Invokes a route handler and parses its JSON response. */
export async function call<T = unknown>(
  handler: unknown,
  method: string,
  path: string,
  opts: RequestOptions & { params?: Record<string, string> } = {},
): Promise<ApiResult<T>> {
  const res = await (handler as Handler)(buildRequest(method, path, opts), {
    params: Promise.resolve(opts.params ?? {}) as Promise<never>,
  });
  const json = (await res.json()) as ApiResponse<T>;
  return {
    status: res.status,
    headers: res.headers,
    json,
    get data(): T {
      if (!json.ok) throw new Error(`Expected success, got ${res.status} ${json.error.code}: ${json.error.message}`);
      return json.data;
    },
  };
}

/** Error code + field map of a failed response (for concise assertions). */
export function errorOf(r: ApiResult<unknown>) {
  if (r.json.ok) throw new Error(`Expected an error, got ${r.status}`);
  return r.json.error;
}
