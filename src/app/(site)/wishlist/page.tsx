import type { Metadata } from "next";
import { RecentlyViewedRail } from "@/components/interactive/recently-viewed";
import { WishlistList } from "@/components/interactive/wishlist";
import { getSiteSettings } from "@/server/queries/settings";

export const metadata: Metadata = {
  title: "Your wishlist",
  description: "Watches you have saved on this device.",
  robots: { index: false, follow: true },
};

export default async function WishlistPage() {
  const { general } = await getSiteSettings();
  const currency = { currencyCode: general.currencyCode, locale: general.locale };
  return (
    <div className="mx-auto w-full max-w-7xl px-4 py-section sm:px-6 lg:px-8">
      <header className="mb-10 flex flex-col gap-3">
        <p className="eyebrow text-brand-ink">Saved on this device</p>
        <h1 className="type-display">
          Your <em className="accent-serif text-aurora pr-[0.08em]">wishlist</em>
        </h1>
        <p className="type-lede max-w-xl text-muted-foreground">
          The pieces you have your eye on. Ask us about any of them on WhatsApp from the product page.
        </p>
      </header>
      <WishlistList currency={currency} />
      <RecentlyViewedRail currency={currency} className="mt-section" />
    </div>
  );
}
