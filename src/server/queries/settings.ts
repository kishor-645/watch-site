import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import { siteSettingsSchema, type SiteSettings } from "@/lib/schemas/settings";
import { DEFAULT_SETTINGS } from "@/lib/site-defaults";
import type { PublicSettings } from "@/lib/types";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "../cache";
import { getCollections } from "../db";
import { log } from "../log";

type Plain = Record<string, unknown>;
const isPlain = (v: unknown): v is Plain => typeof v === "object" && v !== null && !Array.isArray(v) && !(v instanceof Date);

/** Deep-merges stored values over defaults. Arrays and primitives from `stored` replace defaults. */
export function mergeSettings(defaults: SiteSettings, stored: unknown): SiteSettings {
  const merge = (base: unknown, over: unknown): unknown => {
    if (!isPlain(base) || !isPlain(over)) return over === undefined ? base : over;
    const out: Plain = { ...base };
    for (const [k, v] of Object.entries(over)) {
      if (k === "_id" || k === "updatedAt" || k === "updatedBy") continue;
      out[k] = merge(base[k], v);
    }
    return out;
  };
  const merged = merge(defaults, stored);
  const parsed = siteSettingsSchema.safeParse(merged);
  if (!parsed.success) {
    log.error("settings.invalid_stored_document", { issues: parsed.error.issues.slice(0, 5) });
    return defaults;
  }
  return parsed.data;
}

/** Uncached read — for admin screens and server-side validation. */
export async function loadSettings(): Promise<PublicSettings> {
  const { settings } = await getCollections();
  const doc = await settings.findOne({ _id: "global" });
  return { ...mergeSettings(DEFAULT_SETTINGS, doc ?? {}), updatedAt: doc?.updatedAt?.toISOString() ?? null };
}

const cachedSettings = unstable_cache(loadSettings, ["site-settings-v1"], {
  tags: [CACHE_TAGS.settings],
  revalidate: CACHE_REVALIDATE_SECONDS,
});

/**
 * Public, cached site settings. Never throws: if the database is unreachable the defaults are
 * returned (not cached), so the header/footer and WhatsApp links keep working.
 */
export const getSiteSettings = cache(async (): Promise<PublicSettings> => {
  try {
    return await cachedSettings();
  } catch (error) {
    log.error("settings.load_failed", { error });
    return { ...DEFAULT_SETTINGS, updatedAt: null };
  }
});
