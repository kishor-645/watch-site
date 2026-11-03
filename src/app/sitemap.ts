import type { MetadataRoute } from "next";
import { absoluteUrl, productPath } from "@/lib/site-url";
import { getPublishedSlugs } from "@/server/queries/watches";

// Generated per request (from the cached catalogue) so the build never needs the database.
export const dynamic = "force-dynamic";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const pages: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1 },
    { url: absoluteUrl("/shop"), changeFrequency: "daily", priority: 0.9 },
    { url: absoluteUrl("/about"), changeFrequency: "monthly", priority: 0.5 },
    { url: absoluteUrl("/contact"), changeFrequency: "monthly", priority: 0.5 },
  ];

  let watches: { slug: string; updatedAt: string }[] = [];
  try {
    watches = await getPublishedSlugs();
  } catch {
    // Database unavailable: still serve the static pages rather than an error.
  }

  return [
    ...pages,
    ...watches.map((w) => ({
      url: absoluteUrl(productPath(w.slug)),
      lastModified: new Date(w.updatedAt),
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
  ];
}
