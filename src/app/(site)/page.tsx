import type { Metadata } from "next";
import { CtaBand } from "@/components/home/cta-band";
import { FeaturedWatches } from "@/components/home/featured-watches";
import { Hero } from "@/components/home/hero";
import { container } from "@/components/home/section-heading";
import { ShopByCategory } from "@/components/home/shop-by-category";
import { Story } from "@/components/home/story";
import { TrustBar } from "@/components/home/trust-bar";
import { ShopEmpty } from "@/components/shop/shop-empty";
import { formatPrice } from "@/lib/format";
import { parseCatalogQuery } from "@/lib/schemas/catalog-query";
import { absoluteUrl, productPath } from "@/lib/site-url";
import { generalEnquiryUrl, watchEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";
import { getFeaturedWatches, getPublishedWatchBySlug, listPublishedWatches } from "@/server/queries/watches";

const HOME_GRID_SIZE = 8;

/**
 * Watches for the home grid: the ones marked "featured" in the admin ("Highlighted on the home
 * page"), or — if none are — the newest published watches, so the home page never looks empty
 * while the catalogue has stock. An empty list means the catalogue itself is empty.
 */
async function homeWatches() {
  const featured = await getFeaturedWatches(HOME_GRID_SIZE);
  if (featured.length > 0) return { watches: featured, isFallback: false };
  const newest = await listPublishedWatches(parseCatalogQuery({ sort: "newest" }));
  return { watches: newest.items.slice(0, HOME_GRID_SIZE), isFallback: true };
}

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  const { home, general, catalog } = settings;
  const [{ watches, isFallback }, chosen] = await Promise.all([
    homeWatches(),
    home.heroWatchSlug ? getPublishedWatchBySlug(home.heroWatchSlug) : Promise.resolve(null),
  ]);

  const heroWatch = chosen ?? watches[0] ?? null;
  const heroImage = home.heroImageUrl
    ? { url: home.heroImageUrl, alt: heroWatch?.name ?? "", kind: "lifestyle" as const }
    : heroWatch?.images[0]
      ? { url: heroWatch.images[0].url, alt: heroWatch.images[0].alt || heroWatch.name, kind: "product" as const }
      : null;
  const generalHref = generalEnquiryUrl(settings);
  const currency = { currencyCode: general.currencyCode, locale: general.locale };

  return (
    <>
      <Hero
        eyebrow={home.heroEyebrow}
        title={home.heroTitle || general.tagline || general.siteName}
        subtitle={home.heroSubtitle}
        image={heroImage}
        watch={
          heroWatch && {
            name: heroWatch.name,
            href: productPath(heroWatch.slug),
            price: formatPrice(heroWatch.price, currency),
          }
        }
        enquiryHref={
          heroWatch ? watchEnquiryUrl(settings, heroWatch, absoluteUrl(productPath(heroWatch.slug))) : generalHref
        }
      />
      {watches.length > 0 ? (
        <FeaturedWatches
          title={isFallback ? "New arrivals" : home.featuredTitle}
          subtitle={isFallback ? "The latest additions to the collection." : home.featuredSubtitle}
          watches={watches}
          currency={currency}
          viewAllHref={isFallback ? "/shop?sort=newest" : "/shop"}
        />
      ) : (
        <div className={`${container} py-section`}>
          <ShopEmpty filtered={false} whatsappHref={generalHref} />
        </div>
      )}

      {watches.length > 0 && <ShopByCategory categories={catalog.categories} />}
      <Story title={home.storyTitle} body={home.storyBody} imageUrl={home.storyImageUrl} />
      <TrustBar items={home.trustItems} />
      <CtaBand title={home.ctaTitle} body={home.ctaBody} whatsappHref={generalHref} />
    </>
  );
}
