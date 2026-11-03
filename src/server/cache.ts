import "server-only";
import { revalidateTag } from "next/cache";

/**
 * Public data is cached in the Next.js data cache under these tags (see queries/*).
 * Every admin mutation MUST call the matching revalidate function after a successful write,
 * so changes appear on the public site within seconds without a redeploy.
 */
export const CACHE_TAGS = {
  watches: "watches",
  settings: "settings",
} as const;

/** Fallback freshness if a revalidation is ever missed. */
export const CACHE_REVALIDATE_SECONDS = 600;

export function revalidateWatches(): void {
  revalidateTag(CACHE_TAGS.watches);
}

export function revalidateSettings(): void {
  revalidateTag(CACHE_TAGS.settings);
}
