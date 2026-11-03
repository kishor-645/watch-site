import { notFound, permanentRedirect } from "next/navigation";
import { productPath } from "@/lib/site-url";
import { findRedirectSlug, getPublishedWatchBySlug } from "@/server/queries/watches";

/**
 * Existence check lives in a layout (outside this segment's loading.tsx Suspense boundary) so an
 * unknown or unpublished slug returns a real HTTP 404 instead of a streamed 200 + not-found UI.
 * The lookup is deduplicated per request, so page.tsx/generateMetadata reuse the result.
 * A renamed watch's old slug permanently redirects (308) to its current URL.
 */
export default async function WatchLayout({
  children,
  params,
}: {
  children: React.ReactNode;
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const watch = await getPublishedWatchBySlug(slug);
  if (!watch) {
    // redirect()/notFound() throw by design: never wrap them in try/catch.
    const newSlug = await findRedirectSlug(slug);
    if (newSlug && newSlug !== slug) permanentRedirect(productPath(newSlug));
    notFound();
  }
  return children;
}
