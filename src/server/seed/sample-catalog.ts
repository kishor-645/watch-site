import "server-only";
import { ObjectId } from "mongodb";
import { slugify, watchInputSchema, type WatchData } from "@/lib/schemas/watch";
import type { Collections } from "../db";
import type { WatchDoc } from "../models";
import { legacyWatches, type LegacyWatch } from "./legacy-watches";

/** Converts the original static catalogue into validated WatchData (ratings/tags dropped). */
export function legacyToInput(w: LegacyWatch): WatchData {
  return watchInputSchema.parse({
    name: w.name,
    brand: w.brand,
    modelNumber: w.id.toUpperCase(),
    slug: w.slug,
    category: w.category,
    gender: w.gender,
    movement: w.movementType,
    price: w.price,
    originalPrice: w.compareAtPrice ?? null,
    availability: w.inStock ? "in_stock" : "sold_out",
    published: true,
    featured: Boolean(w.isFlagship || w.isMostLoved),
    shortDescription: w.shortDescription,
    description: w.description,
    features: w.features,
    specs: {
      caseMaterial: w.specs.caseMaterial,
      caseSize: w.specs.caseSize,
      strapMaterial: w.specs.strap,
      dialColour: w.specs.dial,
      movementDetail: w.specs.movement,
      waterResistance: w.specs.waterResistance,
      crystal: w.specs.crystal,
      thickness: w.specs.thickness ?? "",
      lugWidth: w.specs.lugWidth ?? "",
      powerReserve: w.specs.powerReserve ?? "",
      warranty: w.specs.warranty,
    },
    extraSpecs: [],
    images: w.images.map((url, i) => ({ url, alt: `${w.name}${i ? ` — view ${i + 1}` : ""}` })),
  });
}

export function sampleWatchDocs(actor: string | null, now = new Date()): WatchDoc[] {
  return legacyWatches.map((w, index) => {
    const data = legacyToInput(w);
    // Stagger timestamps so "Newest" ordering is stable; legacy "isNew" items are newest.
    const offsetMinutes = (w.isNew ? 0 : 60) + index;
    const at = new Date(now.getTime() - offsetMinutes * 60_000);
    const { slug, ...rest } = data;
    return {
      ...rest,
      _id: new ObjectId(),
      slug: slug || slugify(`${data.brand} ${data.name}`),
      brandSlug: slugify(data.brand),
      createdAt: at,
      updatedAt: at,
      createdBy: actor,
      updatedBy: actor,
    };
  });
}

/**
 * Inserts the 15 sample watches only when the catalogue is completely empty.
 * Returns the number of watches inserted (0 if the catalogue already had data).
 */
export async function seedSampleCatalog(c: Pick<Collections, "watches">, actor: string | null): Promise<number> {
  if ((await c.watches.countDocuments({}, { limit: 1 })) > 0) return 0;
  const docs = sampleWatchDocs(actor);
  const res = await c.watches.insertMany(docs, { ordered: false });
  return res.insertedCount;
}
