import type { Metadata } from "next";
import { CartView } from "@/components/cart/cart-view";
import { PageHeader } from "@/components/shop/page-header";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review your selected timepieces. Free insured shipping and a 2-year warranty on every order.",
  robots: { index: false, follow: true },
};

export default function CartPage() {
  return (
    <>
      <PageHeader
        crumbs={[{ label: "Home", href: "/" }, { label: "Cart" }]}
        eyebrow="Shopping Bag"
        title="Your Cart"
      />
      <div className="mx-auto max-w-[1440px] px-4 pt-12 sm:px-6 md:pt-16 lg:px-10">
        <CartView />
      </div>
    </>
  );
}
