import type { z } from "zod";

/* React-free helpers shared by the admin forms (safe to unit test without JSX). */

export type FieldErrors = Record<string, string>;

/** Stable DOM id for a field path, e.g. "specs.caseSize" -> "f-specs-caseSize". */
export function fieldId(path: string): string {
  return `f-${path.replace(/[^a-zA-Z0-9_-]/g, "-")}`;
}

/** First message per dot-joined path, the same format the API uses for `error.fields`. */
export function zodFieldErrors(error: z.ZodError): FieldErrors {
  const out: FieldErrors = {};
  for (const issue of error.issues) {
    const key = issue.path.map(String).join(".") || "_form";
    if (!(key in out)) out[key] = issue.message;
  }
  return out;
}

let counter = 0;
/** Client-side row key for rows added after hydration (initial rows use index-based keys). */
export const newKey = (prefix = "k") => `${prefix}${Date.now().toString(36)}${(counter++).toString(36)}`;

export interface ImageItem {
  /** Client-only key. */
  key: string;
  url: string;
  alt: string;
  pathname?: string;
  /** Uploaded in this editing session and not saved yet → delete the blob if removed. */
  unsaved?: boolean;
}
