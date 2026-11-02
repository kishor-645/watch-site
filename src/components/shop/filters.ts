import { categoryLabels, genderLabels, movementLabels } from "@/lib/catalog";
import type { Gender, Movement, Watch, WatchCategory } from "@/lib/types";

export type SortKey = "featured" | "price-asc" | "price-desc" | "rating" | "newest";

export const sortOptions: { value: SortKey; label: string }[] = [
  { value: "featured", label: "Featured" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "rating", label: "Top Rated" },
  { value: "newest", label: "Newest" },
];

export interface ShopFilters {
  category: WatchCategory[];
  brand: string[];
  gender: Gender[];
  movement: Movement[];
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
}

export type ListFilterKey = "category" | "brand" | "gender" | "movement";

export const categoryOptions = Object.keys(categoryLabels) as WatchCategory[];
export const genderOptions = Object.keys(genderLabels) as Gender[];
export const movementOptions = Object.keys(movementLabels) as Movement[];

interface ParamsLike {
  get(key: string): string | null;
  getAll(key: string): string[];
}

const slugify = (value: string) =>
  value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");

function readList(params: ParamsLike, key: string): Set<string> {
  return new Set(
    params
      .getAll(key)
      .flatMap((v) => v.split(","))
      .map((v) => v.trim().toLowerCase())
      .filter(Boolean),
  );
}

/** Keeps canonical order and accepts either the raw value or its slug (e.g. "tag-heuer"). */
function pick<T extends string>(requested: Set<string>, allowed: readonly T[]): T[] {
  return allowed.filter((a) => requested.has(a.toLowerCase()) || requested.has(slugify(a)));
}

function readNumber(params: ParamsLike, key: string): number | null {
  const raw = params.get(key);
  if (!raw) return null;
  const n = Number.parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
}

export function parseFilters(params: ParamsLike, brands: readonly string[]): ShopFilters {
  const sort = params.get("sort") as SortKey | null;
  return {
    category: pick(readList(params, "category"), categoryOptions),
    brand: pick(readList(params, "brand"), brands),
    gender: pick(readList(params, "gender"), genderOptions),
    movement: pick(readList(params, "movement"), movementOptions),
    minPrice: readNumber(params, "min"),
    maxPrice: readNumber(params, "max"),
    sort: sortOptions.some((o) => o.value === sort) ? (sort as SortKey) : "featured",
  };
}

export function serializeFilters(f: ShopFilters): string {
  const parts: string[] = [];
  const add = (key: string, values: readonly string[]) => {
    if (values.length) parts.push(`${key}=${values.map(encodeURIComponent).join(",")}`);
  };
  add("category", f.category);
  add("brand", f.brand);
  add("gender", f.gender);
  add("movement", f.movement);
  if (f.minPrice != null) parts.push(`min=${f.minPrice}`);
  if (f.maxPrice != null) parts.push(`max=${f.maxPrice}`);
  if (f.sort !== "featured") parts.push(`sort=${f.sort}`);
  return parts.join("&");
}

export function hasActiveFilters(f: ShopFilters): boolean {
  return (
    f.category.length > 0 ||
    f.brand.length > 0 ||
    f.gender.length > 0 ||
    f.movement.length > 0 ||
    f.minPrice != null ||
    f.maxPrice != null
  );
}

function matchesGender(watch: Watch, selected: Gender[]) {
  if (!selected.length) return true;
  // Unisex pieces are suitable for everyone, so they appear under "Men" and "Women" too.
  return selected.includes(watch.gender) || watch.gender === "unisex";
}

export function applyFilters(watches: readonly Watch[], f: ShopFilters): Watch[] {
  const filtered = watches.filter(
    (w) =>
      (!f.category.length || f.category.includes(w.category)) &&
      (!f.brand.length || f.brand.includes(w.brand)) &&
      matchesGender(w, f.gender) &&
      (!f.movement.length || f.movement.includes(w.movementType)) &&
      (f.minPrice == null || w.price >= f.minPrice) &&
      (f.maxPrice == null || w.price <= f.maxPrice),
  );

  const flag = (b?: boolean) => (b ? 1 : 0);
  const sorted = [...filtered];
  switch (f.sort) {
    case "price-asc":
      return sorted.sort((a, b) => a.price - b.price);
    case "price-desc":
      return sorted.sort((a, b) => b.price - a.price);
    case "rating":
      return sorted.sort((a, b) => b.rating - a.rating || b.reviewCount - a.reviewCount);
    case "newest":
      return sorted.sort((a, b) => flag(b.isNew) - flag(a.isNew));
    case "featured":
    default:
      return sorted.sort(
        (a, b) =>
          flag(b.isFlagship) - flag(a.isFlagship) || flag(b.isMostLoved) - flag(a.isMostLoved),
      );
  }
}

/** Rounds catalogue price bounds outwards to the nearest ₹1,000 for a tidy slider. */
export function roundBounds(bounds: { min: number; max: number }) {
  const min = Math.floor(bounds.min / 1000) * 1000;
  const max = Math.max(Math.ceil(bounds.max / 1000) * 1000, min + 1000);
  return { min, max };
}
