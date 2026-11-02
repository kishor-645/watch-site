import type { Metadata } from "next";
import { Suspense } from "react";
import { PageHeader } from "@/components/shop/page-header";
import { ShopView } from "@/components/shop/shop-view";
import { ShopBodySkeleton } from "@/components/shop/skeletons";

export const metadata: Metadata = {
  title: "Shop Luxury Watches",
  description:
    "Explore the MyWatch collection — chronographs, divers, skeletons, dress and everyday watches. Filter by brand, movement and price. Free shipping and a 2-year warranty.",
  alternates: { canonical: "/shop" },
  openGraph: {
    title: "Shop Luxury Watches | MyWatch",
    description: "Chronographs, divers, skeletons and dress watches — authentic, insured and delivered free.",
    url: "/shop",
  },
};

export default function ShopPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Shop" }]}
        eyebrow="The Collection"
        title={
          <>
            Timepieces of <em className="text-gold-gradient font-normal italic">distinction</em>
          </>
        }
        description="Every watch in our boutique is authenticated, insured in transit and backed by a two-year warranty. Refine by style, maker, movement or price to find the one that is yours."
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-10 sm:px-6 md:pt-14 lg:px-10">
        <Suspense fallback={<ShopBodySkeleton />}>
          <ShopView />
        </Suspense>
      </div>
    </>
  );
}
