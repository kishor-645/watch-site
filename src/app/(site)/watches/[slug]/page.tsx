import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { PDP_END_ID } from "@/components/product/constants";
import { ProductCard } from "@/components/product/product-card";
import { ProductGallery } from "@/components/product/product-gallery";
import { ProductInfo } from "@/components/product/product-info";
import { ProductJsonLd } from "@/components/product/product-json-ld";
import { ProductTabs } from "@/components/product/product-tabs";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { watches } from "@/data/watches";
import { categoryLabels, getRelatedWatches, getWatchBySlug } from "@/lib/catalog";

type Props = { params: Promise<{ slug: string }> };

export function generateStaticParams() {
  return watches.map((w) => ({ slug: w.slug }));
}

// Every slug is known at build time. Without this, unknown slugs render on demand and, because
// loading.tsx streams the response, notFound() arrives after a 200 status was already sent.
export const dynamicParams = false;

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const watch = getWatchBySlug(slug);
  if (!watch) return { title: "Watch not found" };

  const url = `/watches/${watch.slug}`;
  return {
    title: `${watch.name} by ${watch.brand}`,
    description: watch.shortDescription,
    alternates: { canonical: url },
    openGraph: {
      type: "website",
      url,
      title: `${watch.name} | MyWatch`,
      description: watch.shortDescription,
      images: watch.images[0] ? [{ url: watch.images[0], width: 1200, alt: watch.name }] : undefined,
    },
    twitter: {
      card: "summary_large_image",
      title: `${watch.name} | MyWatch`,
      description: watch.shortDescription,
      images: watch.images[0] ? [watch.images[0]] : undefined,
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const watch = getWatchBySlug(slug);
  if (!watch) notFound();

  const related = getRelatedWatches(watch, 4);
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

  return (
    <>
      <ProductJsonLd watch={watch} url={`${siteUrl}/watches/${watch.slug}`} />

      <div className="mx-auto max-w-[1440px] px-4 pt-8 sm:px-6 md:pt-10 lg:px-10">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: categoryLabels[watch.category], href: `/shop?category=${watch.category}` },
            { label: watch.name },
          ]}
        />
      </div>

      <section
        aria-label={`${watch.name} overview`}
        className="mx-auto grid max-w-[1440px] gap-10 px-4 pb-20 pt-6 sm:px-6 md:grid-cols-2 md:gap-12 md:pt-10 lg:gap-20 lg:px-10 lg:pb-28"
      >
        <div className="md:sticky md:top-28 md:self-start">
          <ProductGallery images={watch.images} name={watch.name} />
        </div>
        <ProductInfo watch={watch} />
      </section>

      <section
        id="details"
        aria-labelledby="details-heading"
        className="scroll-mt-28 border-t border-border bg-charcoal/40"
      >
        <div className="mx-auto max-w-[1440px] px-4 py-16 sm:px-6 md:py-24 lg:px-10">
          <h2 id="details-heading" className="sr-only">
            Product details
          </h2>
          <ProductTabs watch={watch} />
        </div>
      </section>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-border">
          {/* No bottom padding: the footer's mt-24 provides the final gap. */}
          <div className="mx-auto max-w-[1440px] px-4 pt-16 sm:px-6 md:pt-24 lg:px-10">
            <div className="mb-10 flex flex-col items-center text-center md:mb-14">
              <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Curated for you</p>
              <h2 id="related-heading" className="mt-4 text-3xl font-light md:text-5xl">
                You may also like
              </h2>
              <span aria-hidden className="mt-6 h-px w-16 bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
            </div>
            <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
              {related.map((w) => (
                <li key={w.id}>
                  <ProductCard watch={w} sizes="(min-width: 1024px) 25vw, 50vw" />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <div id={PDP_END_ID} aria-hidden />
    </>
  );
}
