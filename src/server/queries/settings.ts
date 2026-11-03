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

const SECTIONS = Object.keys(siteSettingsSchema.shape) as (keyof SiteSettings)[];

const merge = (base: unknown, over: unknown): unknown => {
  if (!isPlain(base) || !isPlain(over)) return over === undefined ? base : over;
  const out: Plain = { ...base };
  for (const [k, v] of Object.entries(over)) out[k] = merge(base[k], v);
  return out;
};

export interface MergedSettings {
  settings: SiteSettings;
  /** Top-level sections whose stored value failed validation and were replaced by defaults. */
  invalidSections: (keyof SiteSettings)[];
}

/**
 * Deep-merges stored values over defaults, validating each top-level section on its own:
 * a bad value in one section only resets THAT section (logged and reported), so e.g. a broken
 * SEO field never resets the WhatsApp number. Arrays and primitives from `stored` replace defaults.
 */
export function mergeSettings(defaults: SiteSettings, stored: unknown): MergedSettings {
  const source = isPlain(stored) ? stored : {};
  const out: Plain = {};
  const invalidSections: (keyof SiteSettings)[] = [];
  for (const section of SECTIONS) {
    const parsed = siteSettingsSchema.shape[section].safeParse(merge(defaults[section], source[section]));
    if (parsed.success) {
      out[section] = parsed.data;
    } else {
      out[section] = defaults[section];
      invalidSections.push(section);
      log.error("settings.invalid_stored_section", { section, issues: parsed.error.issues.slice(0, 5) });
    }
  }
  return { settings: out as SiteSettings, invalidSections };
}

/** Uncached read — for admin screens and server-side validation. */
export async function loadSettings(): Promise<PublicSettings> {
  const { settings } = await getCollections();
  const doc = await settings.findOne({ _id: "global" });
  const merged = mergeSettings(DEFAULT_SETTINGS, doc ?? {});
  return { ...merged.settings, updatedAt: doc?.updatedAt?.toISOString() ?? null, invalidSections: merged.invalidSections };
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
    return { ...DEFAULT_SETTINGS, updatedAt: null, invalidSections: [] };
  }
});
