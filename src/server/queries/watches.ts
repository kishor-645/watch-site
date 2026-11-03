import "server-only";
import { unstable_cache } from "next/cache";
import { cache } from "react";
import type { Filter, Sort } from "mongodb";
import { AVAILABLE_STATES } from "@/lib/schemas/watch";
import type { CatalogQuery } from "@/lib/schemas/catalog-query";
import type { CatalogFacets, Paginated, Watch } from "@/lib/types";
import { CACHE_REVALIDATE_SECONDS, CACHE_TAGS } from "../cache";
import { getCollections } from "../db";
import { escapeRegex, toWatch } from "../mappers";
import type { WatchDoc } from "../models";

/*
 * PUBLIC catalog reads. Only `published: true` watches are ever returned from this module.
 * All functions are cached under the "watches" tag and return plain JSON-safe DTOs.
 */

const opts = { tags: [CACHE_TAGS.watches], revalidate: CACHE_REVALIDATE_SECONDS };

export function buildCatalogFilter(q: CatalogQuery): Filter<WatchDoc> {
  const filter: Filter<WatchDoc> = { published: true };
  if (q.q) {
    const re = new RegExp(escapeRegex(q.q), "i");
    filter.$or = [{ name: re }, { brand: re }, { modelNumber: re }, { category: re }, { shortDescription: re }];
  }
  if (q.category.length) filter.category = { $in: q.category };
  if (q.brand.length) filter.brandSlug = { $in: q.brand };
  if (q.movement.length) filter.movement = { $in: q.movement };
  // Unisex pieces suit everyone, so they appear under "men" and "women" too.
  if (q.gender.length) filter.gender = { $in: Array.from(new Set([...q.gender, "unisex" as const])) };
  if (q.inStock) filter.availability = { $in: [...AVAILABLE_STATES] };
  if (q.minPrice != null || q.maxPrice != null) {
    filter.price = {
      ...(q.minPrice != null && { $gte: q.minPrice }),
      ...(q.maxPrice != null && { $lte: q.maxPrice }),
    };
  }
  return filter;
}

const SORTS: Record<CatalogQuery["sort"], Sort> = {
  featured: { featured: -1, createdAt: -1, _id: -1 },
  newest: { createdAt: -1, _id: -1 },
  "price-asc": { price: 1, _id: 1 },
  "price-desc": { price: -1, _id: -1 },
};

export const listPublishedWatches = unstable_cache(
  async (query: CatalogQuery): Promise<Paginated<Watch>> => {
    const { watches } = await getCollections();
    const filter = buildCatalogFilter(query);
    const pageSize = Math.min(Math.max(query.pageSize, 1), 48);
    const total = await watches.countDocuments(filter);
    const pageCount = Math.max(1, Math.ceil(total / pageSize));
    const page = Math.min(Math.max(query.page, 1), pageCount);
    const docs = await watches
      .find(filter)
      .sort(SORTS[query.sort])
      .skip((page - 1) * pageSize)
      .limit(pageSize)
      .toArray();
    return { items: docs.map(toWatch), total, page, pageSize, pageCount };
  },
  ["watches-list-v1"],
  opts,
);

const cachedBySlug = unstable_cache(
  async (slug: string): Promise<Watch | null> => {
    const { watches } = await getCollections();
    const doc = await watches.findOne({ slug, published: true });
    return doc ? toWatch(doc) : null;
  },
  ["watch-by-slug-v1"],
  opts,
);
/** Deduplicated per request (generateMetadata + page). */
export const getPublishedWatchBySlug = cache((slug: string) => cachedBySlug(slug.toLowerCase()));

export const getFeaturedWatches = unstable_cache(
  async (limit = 8): Promise<Watch[]> => {
    const { watches } = await getCollections();
    const docs = await watches.find({ published: true }).sort(SORTS.featured).limit(limit).toArray();
    return docs.map(toWatch);
  },
  ["watches-featured-v1"],
  opts,
);

/** Same category first, ordered by closest price; padded with other watches. */
export const getRelatedWatches = unstable_cache(
  async (watchId: string, category: string, price: number, limit = 4): Promise<Watch[]> => {
    const { watches } = await getCollections();
    const docs = await watches
      .find({ published: true }, { projection: { description: 0, features: 0, extraSpecs: 0 } })
      .limit(200)
      .toArray();
    const others = docs.filter((d) => d._id.toHexString() !== watchId);
    const byDistance = (a: WatchDoc, b: WatchDoc) => Math.abs(a.price - price) - Math.abs(b.price - price);
    const same = others.filter((d) => d.category === category).sort(byDistance);
    const rest = others.filter((d) => d.category !== category).sort(byDistance);
    return [...same, ...rest].slice(0, limit).map((d) =>
      toWatch({ ...d, description: "", features: [], extraSpecs: [] }),
    );
  },
  ["watches-related-v1"],
  opts,
);

export const getCatalogFacets = unstable_cache(
  async (): Promise<CatalogFacets> => {
    const { watches } = await getCollections();
    const [brands, bounds] = await Promise.all([
      watches
        .aggregate<{ _id: string; label: string; count: number }>([
          { $match: { published: true } },
          { $group: { _id: "$brandSlug", label: { $first: "$brand" }, count: { $sum: 1 } } },
          { $sort: { label: 1 } },
        ])
        .toArray(),
      watches
        .aggregate<{ min: number; max: number }>([
          { $match: { published: true } },
          { $group: { _id: null, min: { $min: "$price" }, max: { $max: "$price" } } },
        ])
        .toArray(),
    ]);
    return {
      brands: brands.map((b) => ({ slug: b._id, label: b.label, count: b.count })),
      priceBounds: { min: bounds[0]?.min ?? 0, max: bounds[0]?.max ?? 0 },
    };
  },
  ["watches-facets-v1"],
  opts,
);

/** For sitemap.xml. */
export const getPublishedSlugs = unstable_cache(
  async (): Promise<{ slug: string; updatedAt: string }[]> => {
    const { watches } = await getCollections();
    const docs = await watches
      .find({ published: true }, { projection: { slug: 1, updatedAt: 1 } })
      .sort({ updatedAt: -1 })
      .limit(5000)
      .toArray();
    return docs.map((d) => ({ slug: d.slug, updatedAt: d.updatedAt.toISOString() }));
  },
  ["watches-slugs-v1"],
  opts,
);

/** Current slug of the published watch that used to live at `oldSlug` (for 308 redirects), else null. */
export const findRedirectSlug = unstable_cache(
  async (oldSlug: string): Promise<string | null> => {
    const { watches } = await getCollections();
    const doc = await watches.findOne(
      { previousSlugs: oldSlug.toLowerCase(), published: true },
      { projection: { slug: 1 } },
    );
    return doc?.slug ?? null;
  },
  ["watch-redirect-slug-v1"],
  opts,
);
