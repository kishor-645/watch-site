import type { CatalogOption, SiteSettings, SiteSettingsInput } from "@/lib/schemas/settings";
import type { FieldErrors } from "./form-model";

/* Pure (React-free) model of the settings form: state <-> SiteSettingsInput, error mapping, tabs. */

/* ------------------------------------------------------------------ */
/* State                                                               */
/* ------------------------------------------------------------------ */

export type TrustItem = SiteSettings["home"]["trustItems"][number];
export type Movement = SiteSettings["catalog"]["movements"][number];
export type Keyed<T> = T & { key: string; /** slug still follows the label */ autoSlug?: boolean };

export interface SettingsState {
  general: SiteSettings["general"];
  contact: SiteSettings["contact"];
  social: SiteSettings["social"];
  seo: SiteSettings["seo"];
  home: Omit<SiteSettings["home"], "trustItems"> & { trustItems: Keyed<TrustItem>[] };
  about: SiteSettings["about"];
  footer: SiteSettings["footer"];
  catalog: { categories: Keyed<CatalogOption>[]; movements: Keyed<Movement>[] };
}

export type TextSection = "general" | "contact" | "social" | "seo" | "home" | "about" | "footer";
export type StringKeys<T> = { [K in keyof T]: T[K] extends string ? K : never }[keyof T] & string;

export function toState(s: SiteSettings): SettingsState {
  return {
    general: { ...s.general },
    contact: { ...s.contact },
    social: { ...s.social },
    seo: { ...s.seo },
    home: { ...s.home, trustItems: s.home.trustItems.map((t, i) => ({ ...t, key: `t-${i}` })) },
    about: { ...s.about },
    footer: { ...s.footer },
    catalog: {
      categories: s.catalog.categories.map((c, i) => ({ ...c, key: `c-${i}` })),
      movements: s.catalog.movements.map((m, i) => ({ ...m, key: `m-${i}` })),
    },
  };
}

function strip<T extends object>(row: Keyed<T>): T {
  const rest: Record<string, unknown> = { ...row };
  delete rest.key;
  delete rest.autoSlug;
  return rest as T;
}

export function toPayload(s: SettingsState): SiteSettingsInput {
  return {
    general: s.general,
    contact: s.contact,
    social: s.social,
    seo: s.seo,
    home: { ...s.home, trustItems: s.home.trustItems.map((t) => strip<TrustItem>(t)) },
    about: s.about,
    footer: s.footer,
    catalog: {
      categories: s.catalog.categories.map((c) => strip<CatalogOption>(c)),
      movements: s.catalog.movements.map((m) => strip<Movement>(m)),
    },
  };
}

/** Index-based list paths -> row-key paths so errors stay attached to the right row. */
export function remapErrors(fields: FieldErrors, s: SettingsState): FieldErrors {
  const lists: Record<string, { key: string }[]> = {
    "home.trustItems": s.home.trustItems,
    "catalog.categories": s.catalog.categories,
    "catalog.movements": s.catalog.movements,
  };
  const out: FieldErrors = {};
  for (const [path, message] of Object.entries(fields)) {
    let key = path;
    for (const [prefix, rows] of Object.entries(lists)) {
      const m = new RegExp(`^${prefix.replace(".", "\\.")}\\.(\\d+)(\\..*)?$`).exec(path);
      if (m) {
        const row = rows[Number(m[1])];
        if (row) key = `${prefix}.${row.key}${m[2] ?? ""}`;
      }
    }
    if (!(key in out)) out[key] = message;
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* Tabs                                                                */
/* ------------------------------------------------------------------ */

export const TABS = [
  { value: "general", label: "General", sections: ["general"] },
  { value: "contact", label: "Contact & WhatsApp", sections: ["contact"] },
  { value: "home", label: "Homepage", sections: ["home"] },
  { value: "about", label: "About & Footer", sections: ["about", "footer"] },
  { value: "social", label: "Social & SEO", sections: ["social", "seo"] },
  { value: "catalog", label: "Catalogue", sections: ["catalog"] },
] as const;
export type TabValue = (typeof TABS)[number]["value"];

export function tabForPath(path: string): TabValue {
  const section = path.split(".")[0];
  return TABS.find((t) => (t.sections as readonly string[]).includes(section))?.value ?? "general";
}

