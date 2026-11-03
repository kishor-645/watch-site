import { z } from "zod";

/* ------------------------------------------------------------------ */
/* Enumerations                                                        */
/* ------------------------------------------------------------------ */

export const AVAILABILITY = ["in_stock", "limited", "pre_order", "sold_out"] as const;
export type Availability = (typeof AVAILABILITY)[number];

export const availabilityLabels: Record<Availability, string> = {
  in_stock: "In stock",
  limited: "Limited stock",
  pre_order: "Available to order",
  sold_out: "Sold out",
};

/** Availabilities that count as "available" on the dashboard and the "in stock" shop filter. */
export const AVAILABLE_STATES: readonly Availability[] = ["in_stock", "limited", "pre_order"];

export const GENDERS = ["men", "women", "unisex"] as const;
export type Gender = (typeof GENDERS)[number];

export const genderLabels: Record<Gender, string> = {
  men: "Men",
  women: "Women",
  unisex: "Unisex",
};

/* ------------------------------------------------------------------ */
/* Primitives                                                          */
/* ------------------------------------------------------------------ */

export const MAX_PRICE = 100_000_000;
export const MAX_IMAGES = 10;

/**
 * Hosts that product/site images may be served from. Keep in sync with next.config.ts
 * (`remotePatterns` `*.public.blob.vercel-storage.com` matches exactly one DNS label).
 * The server additionally pins Blob URLs to this project's own store (src/server/blob.ts).
 */
const ALLOWED_IMAGE_HOSTS: RegExp[] = [/^images\.unsplash\.com$/i, /^[a-z0-9-]+\.public\.blob\.vercel-storage\.com$/i];

export function isAllowedImageUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "https:" && ALLOWED_IMAGE_HOSTS.some((re) => re.test(url.hostname));
  } catch {
    return false;
  }
}

export const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(1)
  .max(120)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and single hyphens");

export const imageUrlSchema = z
  .string()
  .trim()
  .max(2048)
  .refine(isAllowedImageUrl, "Image must be uploaded through the admin console or come from an allowed host");

const text = (max: number) => z.string().trim().max(max);
const price = z.number().int("Use whole rupees").min(0).max(MAX_PRICE);

/* ------------------------------------------------------------------ */
/* Watch                                                               */
/* ------------------------------------------------------------------ */

export const watchImageSchema = z.object({
  url: imageUrlSchema,
  alt: text(160).default(""),
  /** Vercel Blob pathname — present for uploaded images, used to delete the file later. */
  pathname: text(300).optional(),
});

export const watchSpecsSchema = z.object({
  caseMaterial: text(160).default(""),
  caseSize: text(40).default(""),
  strapMaterial: text(160).default(""),
  dialColour: text(160).default(""),
  movementDetail: text(160).default(""), // calibre / human readable, e.g. "Swiss quartz chronograph"
  waterResistance: text(60).default(""),
  crystal: text(160).default(""),
  thickness: text(40).default(""),
  lugWidth: text(60).default(""),
  powerReserve: text(60).default(""),
  warranty: text(120).default(""),
});

export const extraSpecSchema = z.object({
  label: z.string().trim().min(1).max(40),
  value: z.string().trim().min(1).max(160),
});

/** Base object (no cross-field rules) — use this to derive partial schemas. */
export const watchBaseSchema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(120),
  brand: z.string().trim().min(1, "Brand is required").max(60),
  modelNumber: text(60).default(""),
  /** Optional on input — generated from brand + name when empty. */
  slug: z.union([slugSchema, z.literal("")]).optional(),
  /** Must match a slug in site_settings.catalog.categories (checked server-side). */
  category: slugSchema,
  gender: z.enum(GENDERS),
  /** Must match a slug in site_settings.catalog.movements (checked server-side). */
  movement: slugSchema,
  price,
  originalPrice: price.nullable().default(null),
  availability: z.enum(AVAILABILITY).default("in_stock"),
  published: z.boolean().default(false),
  featured: z.boolean().default(false),
  shortDescription: text(240).default(""),
  description: text(6000).default(""),
  features: z.array(z.string().trim().min(1).max(160)).max(12).default([]),
  specs: watchSpecsSchema.prefault({}),
  extraSpecs: z.array(extraSpecSchema).max(20).default([]),
  images: z.array(watchImageSchema).min(1, "Add at least one image").max(MAX_IMAGES),
});

const originalPriceRule = (d: { price?: number; originalPrice?: number | null }, ctx: z.RefinementCtx) => {
  if (d.originalPrice != null && d.price != null && d.originalPrice <= d.price) {
    ctx.addIssue({
      code: "custom",
      path: ["originalPrice"],
      message: "Original price must be higher than the selling price",
    });
  }
};

/** Full create/replace payload: POST /api/admin/watches, PUT /api/admin/watches/:id */
export const watchInputSchema = watchBaseSchema.superRefine(originalPriceRule);

/** Quick edits from the watch list: PATCH /api/admin/watches/:id */
export const watchPatchSchema = z
  .object({
    price: price.optional(),
    originalPrice: price.nullable().optional(),
    availability: z.enum(AVAILABILITY).optional(),
    published: z.boolean().optional(),
    featured: z.boolean().optional(),
  })
  .refine((d) => Object.keys(d).length > 0, "Nothing to update");

export type WatchInput = z.input<typeof watchInputSchema>;
export type WatchData = z.output<typeof watchBaseSchema>;
export type WatchPatch = z.output<typeof watchPatchSchema>;
export type WatchImage = z.output<typeof watchImageSchema>;
export type WatchSpecs = z.output<typeof watchSpecsSchema>;

/** Human labels for the fixed spec keys, in display order. */
export const specLabels: Record<keyof WatchSpecs, string> = {
  movementDetail: "Movement",
  caseSize: "Case size",
  caseMaterial: "Case material",
  dialColour: "Dial",
  strapMaterial: "Strap",
  crystal: "Crystal",
  waterResistance: "Water resistance",
  thickness: "Thickness",
  lugWidth: "Lug width",
  powerReserve: "Power reserve",
  warranty: "Warranty",
};

export function slugify(value: string): string {
  return value
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 120);
}
