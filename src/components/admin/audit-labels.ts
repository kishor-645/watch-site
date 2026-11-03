import { formatPrice, type CurrencyOptions } from "@/lib/format";
import { availabilityLabels, type Availability } from "@/lib/schemas/watch";
import type { AuditAction, AuditLogEntry } from "@/lib/types";

export const auditActionLabels: Record<AuditAction, string> = {
  "auth.login": "Signed in",
  "auth.login_failed": "Failed sign-in",
  "auth.logout": "Signed out",
  "auth.password_change": "Changed password",
  "auth.bootstrap": "Admin account created",
  "watch.create": "Created watch",
  "watch.update": "Updated watch",
  "watch.delete": "Deleted watch",
  "watch.price_change": "Changed price",
  "watch.publish": "Published watch",
  "watch.unpublish": "Unpublished watch",
  "catalog.seed": "Imported sample watches",
  "settings.update": "Updated settings",
  "upload.create": "Uploaded image",
};

export const AUDIT_ACTIONS = Object.keys(auditActionLabels) as AuditAction[];

/** Display names of the site-settings sections (the keys of `siteSettingsSchema`). */
export const settingsSectionLabels: Record<string, string> = {
  general: "General",
  contact: "Contact",
  social: "Social",
  seo: "SEO",
  home: "Homepage",
  about: "About page",
  footer: "Footer",
  catalog: "Catalogue",
};

const fieldLabels: Record<string, string> = {
  price: "Price",
  originalPrice: "Original price",
  availability: "Availability",
  published: "Published",
  featured: "Featured",
  name: "Name",
  slug: "Slug",
  "contact.whatsappNumber": "WhatsApp number",
  inserted: "Watches imported",
};

function humanize(key: string): string {
  if (fieldLabels[key]) return fieldLabels[key];
  const last = key.split(".").pop() ?? key;
  const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

/** "general" -> "General"; unknown keys are humanized. */
export function sectionLabel(key: string): string {
  const k = key.trim();
  return settingsSectionLabels[k] ?? humanize(k);
}

/** "general, contact" or ["general", "contact"] -> "General, Contact". */
function sectionList(value: unknown): string {
  const keys = Array.isArray(value) ? value.map(String) : typeof value === "string" ? value.split(",") : [];
  return keys
    .map((k) => k.trim())
    .filter(Boolean)
    .map(sectionLabel)
    .join(", ");
}

/**
 * What an entry is about, for the "Details" column. Settings entries name the changed sections
 * ("general, contact, home" -> "General, Contact, Homepage", shown next to "Updated settings");
 * older entries stored them in a `changes.sections` pseudo-change instead — both are handled.
 */
export function entityDisplayLabel(entry: Pick<AuditLogEntry, "action" | "entity" | "changes">): string | null {
  const { entity } = entry;
  if (entity.type === "settings" || entry.action === "settings.update") {
    const legacy = entry.changes?.sections;
    const sections =
      sectionList(entity.label) || (legacy && typeof legacy === "object" ? sectionList(legacy.to) : "");
    return sections || "Site settings";
  }
  return entity.label ?? entity.type;
}

/** Stored as digits with the country code: 919016456462 -> "+91 90164 56462". */
function formatWhatsApp(value: string): string {
  const digits = value.replace(/\D/g, "");
  if (!digits) return value;
  if (digits.length === 12 && digits.startsWith("91")) return `+91 ${digits.slice(2, 7)} ${digits.slice(7)}`;
  return `+${digits}`;
}

function formatValue(key: string, value: unknown, currency: CurrencyOptions): string {
  if (value === null || value === undefined || value === "") return "—";
  if ((key === "price" || key === "originalPrice") && typeof value === "number") return formatPrice(value, currency);
  if (key.endsWith("whatsappNumber") && typeof value === "string") return formatWhatsApp(value);
  if (key === "availability" && typeof value === "string" && value in availabilityLabels) {
    return availabilityLabels[value as Availability];
  }
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (Array.isArray(value)) return value.length ? value.map((v) => String(v)).join(", ") : "—";
  if (typeof value === "object") {
    try {
      return JSON.stringify(value);
    } catch {
      return "…";
    }
  }
  const s = String(value);
  return s.length > 80 ? `${s.slice(0, 77)}…` : s;
}

/**
 * e.g. { price: { from: 42999, to: 39999 } } -> ["Price ₹42,999 → ₹39,999"].
 * Skips the legacy settings `sections` pseudo-change (summarised by `describeEntry`) and no-op
 * changes; tolerates malformed entries (a bare value instead of { from, to }).
 */
export function describeChanges(
  changes: Record<string, { from: unknown; to: unknown }> | null,
  currency: CurrencyOptions,
): string[] {
  if (!changes || typeof changes !== "object") return [];
  return Object.entries(changes).flatMap(([key, change]) => {
    if (key === "sections") return [];
    const c: { from?: unknown; to?: unknown } =
      change && typeof change === "object" && !Array.isArray(change) ? change : { to: change };
    const to = formatValue(key, c.to, currency);
    if (!("from" in c) || c.from === undefined) return to === "—" ? [] : [`${humanize(key)}: ${to}`];
    const from = formatValue(key, c.from, currency);
    return from === to ? [] : [`${humanize(key)} ${from} → ${to}`];
  });
}
