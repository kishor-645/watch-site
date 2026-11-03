import { slugSchema } from "@/lib/schemas/watch";
import { ApiError, ok, withApi } from "@/server/http";
import { getPublishedBySlugs } from "@/server/queries/watches";

export const runtime = "nodejs";

/**
 * GET /api/catalog/snapshots?slugs=a,b,c — public, read-only. Returns current price/availability/
 * image for published watches so client-side wishlist / recently-viewed lists never show stale data.
 */
export const GET = withApi(
  async ({ req }) => {
    const raw = req.nextUrl.searchParams.get("slugs") ?? "";
    const slugs = Array.from(new Set(raw.split(",").map((s) => s.trim().toLowerCase()).filter(Boolean)));
    if (slugs.length > 60) throw new ApiError(400, "BAD_REQUEST", "Too many slugs");
    const valid = slugs.filter((s) => slugSchema.safeParse(s).success).sort();
    const items = await getPublishedBySlugs(valid);
    return ok({
      items: items.map((w) => ({
        slug: w.slug,
        name: w.name,
        brand: w.brand,
        price: w.price,
        originalPrice: w.originalPrice,
        availability: w.availability,
        image: w.images[0]?.url ?? null,
        imageAlt: w.images[0]?.alt || w.name,
      })),
    });
  },
  { auth: false },
);
