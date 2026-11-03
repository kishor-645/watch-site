import type { CurrencyOptions } from "@/lib/format";
import type { CatalogQuery } from "@/lib/types";

export interface Option {
  slug: string;
  label: string;
  count?: number;
}

/** Everything the client-side filter UI needs, computed on the server. */
export interface ShopOptions {
  categories: Option[];
  brands: Option[];
  movements: Option[];
  genders: Option[];
  /** Rounded slider bounds; `null` when there is no price spread to filter on. */
  bounds: { min: number; max: number; step: number } | null;
  currency: CurrencyOptions;
}

export type ListKey = "category" | "brand" | "gender" | "movement";

export const EMPTY_FILTERS: Partial<CatalogQuery> = {
  q: "",
  category: [],
  brand: [],
  gender: [],
  movement: [],
  inStock: false,
  minPrice: null,
  maxPrice: null,
};

export function hasActiveFilters(q: CatalogQuery): boolean {
  return Boolean(
    q.q ||
      q.category.length ||
      q.brand.length ||
      q.gender.length ||
      q.movement.length ||
      q.inStock ||
      q.minPrice != null ||
      q.maxPrice != null,
  );
}

/** Rounds catalogue price bounds outwards to a tidy step for the slider. */
export function sliderBounds(bounds: { min: number; max: number }): ShopOptions["bounds"] {
  const range = bounds.max - bounds.min;
  if (!(range > 0)) return null;
  const step = Math.max(1, 10 ** Math.floor(Math.log10(range / 20)));
  const min = Math.floor(bounds.min / step) * step;
  const max = Math.ceil(bounds.max / step) * step;
  return { min, max, step };
}
