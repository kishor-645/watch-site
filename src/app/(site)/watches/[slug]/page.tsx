import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { container } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { ProductDetails } from "@/components/product/product-details";
import { ProductGallery } from "@/components/product/product-gallery";
import { ENQUIRY_CTA_ID, ProductInfo } from "@/components/product/product-info";
import { ProductJsonLd } from "@/components/product/product-json-ld";
import { StickyEnquiryBar } from "@/components/product/sticky-enquiry-bar";
import { Breadcrumbs } from "@/components/shop/breadcrumbs";
import { toParagraphs } from "@/components/site/text";
import { formatPrice } from "@/lib/format";
import { optionLabel } from "@/lib/schemas/settings";
import { absoluteUrl, productPath } from "@/lib/site-url";
import { watchEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";
import { getPublishedWatchBySlug, getRelatedWatches } from "@/server/queries/watches";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const watch = await getPublishedWatchBySlug(slug);
  if (!watch) return { title: "Watch not found", robots: { index: false } };

  const path = productPath(watch.slug);
  const description = (watch.shortDescription || toParagraphs(watch.description)[0] || "").slice(0, 170);
  const title = watch.name.toLowerCase().includes(watch.brand.toLowerCase())
    ? watch.name
    : `${watch.name} by ${watch.brand}`;
  const image = watch.images[0];
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: "website",
      url: path,
      title,
      description,
      ...(image && { images: [{ url: image.url, alt: image.alt || watch.name }] }),
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      ...(image && { images: [image.url] }),
    },
  };
}

export default async function WatchPage({ params }: Props) {
  const { slug } = await params;
  const [watch, settings] = await Promise.all([getPublishedWatchBySlug(slug), getSiteSettings()]);
  if (!watch) notFound();

  const related = await getRelatedWatches(watch.id, watch.category, watch.price, 4);
  const url = absoluteUrl(productPath(watch.slug));
  const categoryLabel = optionLabel(settings.catalog.categories, watch.category);
  const movementLabel = optionLabel(settings.catalog.movements, watch.movement);
  const currency = settings.general;
  const enquiryHref = watchEnquiryUrl(settings, watch, url);

  return (
    <>
      <ProductJsonLd
        watch={watch}
        url={url}
        currencyCode={settings.general.currencyCode}
        sellerName={settings.general.siteName}
        categoryLabel={categoryLabel}
      />

      <div className={`${container} pt-5 md:pt-8`}>
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: categoryLabel, href: `/shop?category=${encodeURIComponent(watch.category)}` },
            { label: watch.name },
          ]}
        />
      </div>

      <section
        aria-label={`${watch.name} overview`}
        className={`${container} grid gap-8 pb-section pt-5 md:grid-cols-12 md:gap-10 md:pt-8 lg:gap-16 xl:gap-24`}
      >
        <div className="md:sticky md:top-24 md:col-span-7 md:self-start">
          <ProductGallery images={watch.images.map(({ url, alt }) => ({ url, alt }))} name={watch.name} />
        </div>
        <div className="md:col-span-5 md:pt-2">
          <ProductInfo
            watch={watch}
            categoryLabel={categoryLabel}
            currency={currency}
            contact={settings.contact}
            trustItems={settings.home.trustItems}
            enquiryHref={enquiryHref}
          />
        </div>
      </section>

      <div className="border-t border-border">
        <div className={`${container} py-section`}>
          <ProductDetails watch={watch} categoryLabel={categoryLabel} movementLabel={movementLabel} />
        </div>
      </div>

      {related.length > 0 && (
        <section aria-labelledby="related-heading" className="border-t border-border">
          <div className={`${container} py-section`}>
            <h2 id="related-heading" className="type-h2 text-foreground">
              You may also like
            </h2>
            <ul className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:mt-14 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14">
              {related.map((w) => (
                <li key={w.id}>
                  <ProductCard
                    watch={w}
                    currency={currency}
                    sizes="(min-width: 1320px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 50vw"
                  />
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      <StickyEnquiryBar targetId={ENQUIRY_CTA_ID} price={formatPrice(watch.price, currency)} href={enquiryHref} />
    </>
  );
}
