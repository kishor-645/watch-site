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
import { absoluteUrl, productPath } from "@/lib/site-url";
import { generalEnquiryUrl, watchEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";
import { getFeaturedWatches, getPublishedWatchBySlug } from "@/server/queries/watches";

export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

export default async function HomePage() {
  const settings = await getSiteSettings();
  const { home, general, catalog } = settings;
  const [featured, chosen] = await Promise.all([
    getFeaturedWatches(8),
    home.heroWatchSlug ? getPublishedWatchBySlug(home.heroWatchSlug) : Promise.resolve(null),
  ]);

  const heroWatch = chosen ?? featured[0] ?? null;
  const heroImage = home.heroImageUrl
    ? { url: home.heroImageUrl, alt: heroWatch?.name ?? "" }
    : heroWatch?.images[0]
      ? { url: heroWatch.images[0].url, alt: heroWatch.images[0].alt || heroWatch.name }
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
      <TrustBar items={home.trustItems} />

      {featured.length > 0 ? (
        <FeaturedWatches
          title={home.featuredTitle}
          subtitle={home.featuredSubtitle}
          watches={featured}
          currency={currency}
        />
      ) : (
        <div className={`${container} py-20`}>
          <ShopEmpty filtered={false} whatsappHref={generalHref} />
        </div>
      )}

      {featured.length > 0 && <ShopByCategory categories={catalog.categories} />}
      <Story title={home.storyTitle} body={home.storyBody} imageUrl={home.storyImageUrl} />
      <CtaBand title={home.ctaTitle} body={home.ctaBody} whatsappHref={generalHref} />
    </>
  );
}
