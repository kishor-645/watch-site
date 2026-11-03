import { formatPrice, type CurrencyOptions } from "@/lib/format";
import { availabilityLabels, type Availability } from "@/lib/schemas/watch";
import type { AuditAction } from "@/lib/types";

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

const fieldLabels: Record<string, string> = {
  price: "Price",
  originalPrice: "Original price",
  availability: "Availability",
  published: "Published",
  featured: "Featured",
  name: "Name",
  slug: "Slug",
  sections: "Sections",
  "contact.whatsappNumber": "WhatsApp number",
  inserted: "Watches imported",
};

function humanize(key: string): string {
  if (fieldLabels[key]) return fieldLabels[key];
  const last = key.split(".").pop() ?? key;
  const spaced = last.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/[_-]+/g, " ");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1).toLowerCase();
}

function formatValue(key: string, value: unknown, currency: CurrencyOptions): string {
  if (value === null || value === undefined || value === "") return "—";
  if ((key === "price" || key === "originalPrice") && typeof value === "number") return formatPrice(value, currency);
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

/** e.g. { price: { from: 42999, to: 39999 } } -> ["Price ₹42,999 → ₹39,999"] */
export function describeChanges(
  changes: Record<string, { from: unknown; to: unknown }> | null,
  currency: CurrencyOptions,
): string[] {
  if (!changes) return [];
  return Object.entries(changes).map(([key, change]) => {
    const c = (change ?? {}) as { from?: unknown; to?: unknown };
    const hasFrom = "from" in c && c.from !== undefined;
    const to = formatValue(key, c.to, currency);
    return hasFrom ? `${humanize(key)} ${formatValue(key, c.from, currency)} → ${to}` : `${humanize(key)}: ${to}`;
  });
}
