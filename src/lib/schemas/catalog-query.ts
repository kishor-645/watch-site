import { z } from "zod";
import { GENDERS } from "./watch";

export const SORT_OPTIONS = [
  { value: "featured", label: "Featured" },
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
] as const;
export type SortKey = (typeof SORT_OPTIONS)[number]["value"];

export const CATALOG_PAGE_SIZE = 12;

export interface CatalogQuery {
  q: string;
  category: string[];
  brand: string[];
  gender: (typeof GENDERS)[number][];
  movement: string[];
  /** Only show watches that are not sold out. */
  inStock: boolean;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortKey;
  page: number;
  pageSize: number;
}

type RawParams = Record<string, string | string[] | undefined> | URLSearchParams;

function getAll(params: RawParams, key: string): string[] {
  const raw = params instanceof URLSearchParams ? params.getAll(key) : ([] as string[]).concat(params[key] ?? []);
  return raw
    .flatMap((v) => v.split(","))
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean)
    .slice(0, 30);
}

function getOne(params: RawParams, key: string): string | undefined {
  return getAll(params, key)[0];
}

function int(value: string | undefined, min: number, max: number): number | null {
  if (!value) return null;
  const n = Number.parseInt(value, 10);
  return Number.isFinite(n) && n >= min && n <= max ? n : null;
}

const genderSet = new Set<string>(GENDERS);
const sortSet = new Set<string>(SORT_OPTIONS.map((s) => s.value));

/**
 * Parses shop URL params leniently (invalid values are dropped, never thrown).
 * URL format: ?q=&category=a,b&brand=x&gender=men&movement=automatic&stock=1&min=&max=&sort=&page=
 * Category/brand/movement values are slugs (brands are matched case-insensitively by slug).
 */
export function parseCatalogQuery(params: RawParams): CatalogQuery {
  const q = (params instanceof URLSearchParams ? params.get("q") : ([] as string[]).concat(params.q ?? [])[0]) ?? "";
  const sort = getOne(params, "sort");
  return {
    q: q.trim().slice(0, 80),
    category: getAll(params, "category"),
    brand: getAll(params, "brand"),
    gender: getAll(params, "gender").filter((g): g is CatalogQuery["gender"][number] => genderSet.has(g)),
    movement: getAll(params, "movement"),
    inStock: getOne(params, "stock") === "1",
    minPrice: int(getOne(params, "min"), 0, 100_000_000),
    maxPrice: int(getOne(params, "max"), 0, 100_000_000),
    sort: sort && sortSet.has(sort) ? (sort as SortKey) : "featured",
    page: int(getOne(params, "page"), 1, 10_000) ?? 1,
    pageSize: CATALOG_PAGE_SIZE,
  };
}

export function serializeCatalogQuery(q: Partial<CatalogQuery>): string {
  const sp = new URLSearchParams();
  if (q.q) sp.set("q", q.q);
  for (const key of ["category", "brand", "gender", "movement"] as const) {
    const v = q[key];
    if (v && v.length) sp.set(key, v.join(","));
  }
  if (q.inStock) sp.set("stock", "1");
  if (q.minPrice != null) sp.set("min", String(q.minPrice));
  if (q.maxPrice != null) sp.set("max", String(q.maxPrice));
  if (q.sort && q.sort !== "featured") sp.set("sort", q.sort);
  if (q.page && q.page > 1) sp.set("page", String(q.page));
  return sp.toString();
}

/** Admin watch list query: GET /api/admin/watches */
export const adminWatchQuerySchema = z.object({
  q: z.string().trim().max(80).default(""),
  status: z.enum(["all", "published", "draft"]).default("all"),
  availability: z.enum(["all", "in_stock", "limited", "pre_order", "sold_out"]).default("all"),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(20),
});
export type AdminWatchQuery = z.output<typeof adminWatchQuerySchema>;

export const auditQuerySchema = z.object({
  action: z.string().trim().max(60).default(""),
  page: z.coerce.number().int().min(1).max(10_000).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(30),
});
export type AuditQuery = z.output<typeof auditQuerySchema>;
