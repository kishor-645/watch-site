import type { Watch } from "@/lib/types";

/** Minimal client-side copy of a watch, stored for wishlist / recently viewed (localStorage). */
export interface WatchSnapshot {
  slug: string;
  name: string;
  brand: string;
  price: number;
  originalPrice: number | null;
  availability: Watch["availability"];
  image: string | null;
  imageAlt: string;
}

export function toSnapshot(
  w: Pick<Watch, "slug" | "name" | "brand" | "price" | "originalPrice" | "availability" | "images">,
): WatchSnapshot {
  const img = w.images[0];
  return {
    slug: w.slug,
    name: w.name,
    brand: w.brand,
    price: w.price,
    originalPrice: w.originalPrice ?? null,
    availability: w.availability,
    image: img?.url ?? null,
    imageAlt: img?.alt || w.name,
  };
}

/** Data the quick-view modal needs (all serialisable, passed from server components). */
export interface QuickViewWatch {
  slug: string;
  name: string;
  brand: string;
  modelNumber: string;
  price: number;
  originalPrice: number | null;
  availability: Watch["availability"];
  shortDescription: string;
  images: { url: string; alt: string }[];
  caseSize: string;
  movementDetail: string;
}
