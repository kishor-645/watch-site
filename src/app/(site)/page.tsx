import type { Metadata } from "next";
import { getFlagship, getMostLoved } from "@/lib/catalog";
import { watches } from "@/data/watches";
import { formatPrice } from "@/lib/format";
import { Hero } from "@/components/home/hero";
import { TrustBar } from "@/components/home/trust-bar";
import { FeaturedCollections } from "@/components/home/featured-collections";
import { MostLoved } from "@/components/home/most-loved";
import { FlagshipSpotlight } from "@/components/home/flagship-spotlight";
import { ShopByStyle } from "@/components/home/shop-by-style";
import { BrandStory } from "@/components/home/brand-story";
import { Newsletter } from "@/components/home/newsletter";

export const metadata: Metadata = {
  title: { absolute: "MyWatch — Timeless Luxury. Crafted for You." },
  description:
    "Shop authentic luxury watches at MyWatch. Discover the Aurora Chronograph, divers, skeletons and dress watches with free insured shipping and a 2-year warranty.",
  alternates: { canonical: "/" },
};

export default function HomePage() {
  const flagship = getFlagship();
  const mostLoved = [flagship, ...getMostLoved().filter((w) => w.id !== flagship.id)];

  const skeleton = watches.find((w) => w.category === "skeleton" && w.id !== flagship.id);
  const storyImage = skeleton?.images[0] ?? flagship.images[0];
  const storySecondary = skeleton?.images[1] ?? flagship.images[1];

  return (
    <>
      <Hero
        name={flagship.name}
        slug={flagship.slug}
        image={flagship.images[0]}
        price={formatPrice(flagship.price)}
        tagline="Flagship"
      />
      <TrustBar />
      <FeaturedCollections />
      <MostLoved watches={mostLoved} />
      <FlagshipSpotlight watch={flagship} />
      <ShopByStyle />
      <BrandStory image={storyImage} secondaryImage={storySecondary !== storyImage ? storySecondary : undefined} />
      <Newsletter />
    </>
  );
}
