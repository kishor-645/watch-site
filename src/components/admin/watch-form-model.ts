import {
  MAX_PRICE,
  specLabels,
  watchInputSchema,
  type Availability,
  type Gender,
  type WatchInput,
  type WatchSpecs,
} from "@/lib/schemas/watch";
import type { Watch } from "@/lib/types";
import { type FieldErrors, type ImageItem, zodFieldErrors } from "./form-model";

/* Pure (React-free) model of the watch form: state <-> WatchInput payload, validation, error mapping. */

export const MAX_FEATURES = 12;
export const MAX_EXTRA_SPECS = 20;
export const SPEC_KEYS = Object.keys(specLabels) as (keyof WatchSpecs)[];

export interface Row {
  key: string;
  value: string;
}
export interface ExtraRow {
  key: string;
  label: string;
  value: string;
}

export interface FormState {
  name: string;
  brand: string;
  modelNumber: string;
  slug: string;
  slugAuto: boolean;
  /** Not saved yet: an automatic slug is sent empty so the server can de-duplicate it. */
  isNew: boolean;
  category: string;
  gender: Gender;
  movement: string;
  price: string;
  originalPrice: string;
  availability: Availability;
  published: boolean;
  featured: boolean;
  shortDescription: string;
  description: string;
  features: Row[];
  specs: Record<keyof WatchSpecs, string>;
  extraSpecs: ExtraRow[];
  images: ImageItem[];
}

export type Option = { slug: string; label: string };

export function emptySpecs(): Record<keyof WatchSpecs, string> {
  return Object.fromEntries(SPEC_KEYS.map((k) => [k, ""])) as Record<keyof WatchSpecs, string>;
}

export function stateFromWatch(w: Watch | undefined, categories: Option[], movements: Option[]): FormState {
  if (!w) {
    return {
      name: "",
      brand: "",
      modelNumber: "",
      slug: "",
      slugAuto: true,
      isNew: true,
      category: categories[0]?.slug ?? "",
      gender: "men",
      movement: movements[0]?.slug ?? "",
      price: "",
      originalPrice: "",
      availability: "in_stock",
      published: false,
      featured: false,
      shortDescription: "",
      description: "",
      features: [],
      specs: emptySpecs(),
      extraSpecs: [],
      images: [],
    };
  }
  return {
    name: w.name,
    brand: w.brand,
    modelNumber: w.modelNumber,
    slug: w.slug,
    slugAuto: false,
    isNew: false,
    category: w.category,
    gender: w.gender,
    movement: w.movement,
    price: String(w.price),
    originalPrice: w.originalPrice == null ? "" : String(w.originalPrice),
    availability: w.availability,
    published: w.published,
    featured: w.featured,
    shortDescription: w.shortDescription,
    description: w.description,
    features: w.features.map((value, i) => ({ key: `f-${i}`, value })),
    specs: { ...emptySpecs(), ...w.specs },
    extraSpecs: w.extraSpecs.map((s, i) => ({ key: `x-${i}`, label: s.label, value: s.value })),
    images: w.images.map((img, i) => ({ key: `i-${i}`, url: img.url, alt: img.alt, pathname: img.pathname })),
  };
}

/** "42,999" -> 42999; "" -> null; invalid -> NaN */
export function parseMoney(raw: string): number | null {
  const cleaned = raw.replace(/[,\s]/g, "");
  if (!cleaned) return null;
  return /^\d+$/.test(cleaned) ? Number(cleaned) : Number.NaN;
}

export interface PayloadResult {
  payload: WatchInput;
  /** payload path index -> row key, to map index-based errors back onto rows */
  featureKeys: string[];
  extraKeys: string[];
  imageKeys: string[];
}

export function toPayload(s: FormState): PayloadResult {
  const features = s.features.filter((f) => f.value.trim());
  const extras = s.extraSpecs.filter((x) => x.label.trim() || x.value.trim());
  const price = parseMoney(s.price);
  return {
    payload: {
      name: s.name.trim(),
      brand: s.brand.trim(),
      modelNumber: s.modelNumber.trim(),
      slug: s.isNew && s.slugAuto ? "" : s.slug.trim(),
      category: s.category,
      gender: s.gender,
      movement: s.movement,
      price: price ?? Number.NaN,
      originalPrice: parseMoney(s.originalPrice),
      availability: s.availability,
      published: s.published,
      featured: s.featured,
      shortDescription: s.shortDescription.trim(),
      description: s.description.trim(),
      features: features.map((f) => f.value.trim()),
      specs: Object.fromEntries(SPEC_KEYS.map((k) => [k, s.specs[k].trim()])) as WatchSpecs,
      extraSpecs: extras.map((x) => ({ label: x.label.trim(), value: x.value.trim() })),
      images: s.images.map((img) => ({
        url: img.url,
        alt: img.alt.trim(),
        ...(img.pathname ? { pathname: img.pathname } : {}),
      })),
    },
    featureKeys: features.map((f) => f.key),
    extraKeys: extras.map((x) => x.key),
    imageKeys: s.images.map((i) => i.key),
  };
}

/** Rewrites "features.2" -> "features.<rowKey>" etc. so errors follow rows when they move. */
export function remapErrors(fields: FieldErrors, r: Pick<PayloadResult, "featureKeys" | "extraKeys" | "imageKeys">): FieldErrors {
  const out: FieldErrors = {};
  for (const [path, message] of Object.entries(fields)) {
    const m = /^(features|extraSpecs|images)\.(\d+)(\..*)?$/.exec(path);
    let key = path;
    if (m) {
      const list = m[1] === "features" ? r.featureKeys : m[1] === "extraSpecs" ? r.extraKeys : r.imageKeys;
      const rowKey = list[Number(m[2])];
      if (rowKey) key = `${m[1]}.${rowKey}${m[3] ?? ""}`;
    }
    if (!(key in out)) out[key] = message;
  }
  return out;
}

export function clientValidate(s: FormState): FieldErrors {
  const result = toPayload(s);
  const errors: FieldErrors = {};
  const price = parseMoney(s.price);
  if (price === null) errors.price = "Enter the selling price";
  else if (Number.isNaN(price)) errors.price = "Enter a whole number, e.g. 42999";
  else if (price > MAX_PRICE) errors.price = "Price is too high";
  const original = parseMoney(s.originalPrice);
  if (original !== null && Number.isNaN(original)) errors.originalPrice = "Enter a whole number or leave empty";
  if (!s.category) errors.category = "Choose a category";
  if (!s.movement) errors.movement = "Choose a movement";
  s.extraSpecs.forEach((x) => {
    if (x.label.trim() && !x.value.trim()) errors[`extraSpecs.${x.key}.value`] = "Enter a value or remove the row";
    if (!x.label.trim() && x.value.trim()) errors[`extraSpecs.${x.key}.label`] = "Enter a label or remove the row";
  });
  const parsed = watchInputSchema.safeParse(result.payload);
  if (!parsed.success) {
    const zodErrors = remapErrors(zodFieldErrors(parsed.error), result);
    for (const [k, v] of Object.entries(zodErrors)) if (!(k in errors)) errors[k] = v;
  }
  return errors;
}
