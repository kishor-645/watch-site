import { notFound } from "next/navigation";
import { getPublishedWatchBySlug } from "@/server/queries/watches";

/**
 * Existence check lives in a layout (outside this segment's loading.tsx Suspense boundary) so an
 * unknown or unpublished slug returns a real HTTP 404 instead of a streamed 200 + not-found UI.
 * The lookup is deduplicated per request, so page.tsx/generateMetadata reuse the result.
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
  if (!watch) notFound();
  return children;
}
