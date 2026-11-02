"use client";

import { useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { ArrowRight, BadgeCheck, Lock, RotateCcw, ShoppingBag, Trash, Truck } from "lucide-react";
import { toast } from "sonner";
import { QuantityStepper } from "@/components/product/quantity-stepper";
import { Bone } from "@/components/shop/skeletons";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { getWatchById } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Watch } from "@/lib/types";

/** Indian GST on watches; catalogue prices are GST-inclusive. */
const GST_RATE = 0.18;
const EASE = [0.22, 1, 0.36, 1] as const;

export function CartView() {
  const { items, hydrated, setQuantity, removeItem, addItem } = useCart();

  const lines = items
    .map((item) => ({ item, watch: getWatchById(item.watchId) }))
    .filter((l): l is { item: (typeof items)[number]; watch: Watch } => Boolean(l.watch));

  // Drop items whose product no longer exists in the catalogue.
  useEffect(() => {
    if (!hydrated) return;
    items.forEach((i) => {
      if (!getWatchById(i.watchId)) removeItem(i.watchId);
    });
  }, [hydrated, items, removeItem]);

  if (!hydrated) return <CartSkeleton />;
  if (!lines.length)
    return (
      <MotionConfig reducedMotion="user">
        <EmptyCart />
      </MotionConfig>
    );

  const itemCount = lines.reduce((n, l) => n + l.item.quantity, 0);
  const subtotal = lines.reduce((sum, l) => sum + l.watch.price * l.item.quantity, 0);
  const savings = lines.reduce(
    (sum, l) =>
      sum +
      (l.watch.compareAtPrice && l.watch.compareAtPrice > l.watch.price
        ? (l.watch.compareAtPrice - l.watch.price) * l.item.quantity
        : 0),
    0,
  );
  const gst = Math.round(subtotal - subtotal / (1 + GST_RATE));

  const remove = (watch: Watch, quantity: number) => {
    removeItem(watch.id);
    toast(`${watch.name} removed`, {
      action: { label: "Undo", onClick: () => addItem(watch.id, quantity) },
    });
  };

  return (
    <MotionConfig reducedMotion="user">
      <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 xl:gap-24">
        <section aria-labelledby="cart-items-heading">
          <div className="flex items-baseline justify-between border-b border-border pb-5">
            <h2 id="cart-items-heading" className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
              Your selection
            </h2>
            <p className="text-sm text-muted-foreground">
              {itemCount} {itemCount === 1 ? "item" : "items"}
            </p>
          </div>

          <ul>
            <AnimatePresence initial={false}>
              {lines.map(({ item, watch }) => (
                <motion.li
                  key={watch.id}
                  layout
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0, height: 0, transition: { duration: 0.3, ease: EASE } }}
                  className="overflow-hidden border-b border-border"
                >
                  <article className="flex gap-4 py-6 sm:gap-6 sm:py-8">
                    <Link
                      href={`/watches/${watch.slug}`}
                      className="relative aspect-[4/5] w-24 shrink-0 overflow-hidden rounded-md border border-border bg-card focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 sm:w-32"
                      tabIndex={-1}
                      aria-hidden
                    >
                      {watch.images[0] && (
                        <Image
                          src={watch.images[0]}
                          alt=""
                          fill
                          sizes="(min-width: 640px) 128px, 96px"
                          className="object-cover transition-transform duration-500 hover:scale-105"
                        />
                      )}
                    </Link>

                    <div className="flex min-w-0 flex-1 flex-col">
                      <div className="flex items-start justify-between gap-4">
                        <div className="min-w-0">
                          <p className="text-[10px] uppercase tracking-[0.3em] text-gold">{watch.brand}</p>
                          <h3 className="mt-1.5 font-serif text-lg leading-snug sm:text-xl">
                            <Link
                              href={`/watches/${watch.slug}`}
                              className="rounded-sm transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                            >
                              {watch.name}
                            </Link>
                          </h3>
                          <p className="mt-1 text-sm tabular-nums text-muted-foreground">
                            {formatPrice(watch.price)}
                            {item.quantity > 1 && <span> each</span>}
                          </p>
                        </div>
                        <p className="hidden shrink-0 font-serif text-xl tabular-nums sm:block">
                          {formatPrice(watch.price * item.quantity)}
                        </p>
                      </div>

                      <div className="mt-auto flex items-center justify-between gap-3 pt-4">
                        <QuantityStepper
                          size="sm"
                          value={item.quantity}
                          onChange={(q) => setQuantity(watch.id, q)}
                          label={`Quantity for ${watch.name}`}
                        />
                        <div className="flex items-center gap-3">
                          <p className="font-serif text-lg tabular-nums sm:hidden">
                            {formatPrice(watch.price * item.quantity)}
                          </p>
                          <button
                            type="button"
                            onClick={() => remove(watch, item.quantity)}
                            aria-label={`Remove ${watch.name} from cart`}
                            className="-m-1.5 inline-flex min-h-9 min-w-9 items-center justify-center gap-2 rounded-sm p-1.5 text-xs uppercase tracking-[0.2em] text-muted-foreground transition-colors hover:text-destructive focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                          >
                            <Trash aria-hidden className="size-4" strokeWidth={1.5} />
                            <span className="hidden sm:inline">Remove</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  </article>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>

          <Link
            href="/shop"
            className="mt-8 inline-flex items-center gap-2 rounded-sm text-[11px] uppercase tracking-[0.25em] text-muted-foreground transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
          >
            <ArrowRight aria-hidden className="size-3.5 rotate-180" />
            Continue shopping
          </Link>
        </section>

        <aside aria-labelledby="summary-heading" className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-lg border border-border bg-card p-6 sm:p-8">
            <h2 id="summary-heading" className="font-serif text-2xl font-light">
              Order summary
            </h2>
            <span aria-hidden className="mt-4 block h-px w-12 bg-gold/60" />

            <dl className="mt-8 space-y-4 text-sm">
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Subtotal ({itemCount} {itemCount === 1 ? "item" : "items"})
                </dt>
                <dd className="tabular-nums">{formatPrice(subtotal)}</dd>
              </div>
              {savings > 0 && (
                <div className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">You save</dt>
                  <dd className="tabular-nums text-gold">−{formatPrice(savings)}</dd>
                </div>
              )}
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">Shipping</dt>
                <dd className="text-[11px] uppercase tracking-[0.25em] text-gold">Free</dd>
              </div>
              <div className="flex justify-between gap-4">
                <dt className="text-muted-foreground">
                  Estimated GST <span className="text-xs">(18%, included)</span>
                </dt>
                <dd className="tabular-nums text-muted-foreground">{formatPrice(gst)}</dd>
              </div>
            </dl>

            <div className="mt-6 flex items-baseline justify-between gap-4 border-t border-border pt-6">
              <span className="text-[11px] uppercase tracking-[0.3em] text-foreground/80">Total</span>
              <span className="font-serif text-3xl tabular-nums">{formatPrice(subtotal)}</span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Prices are inclusive of GST. Final tax is confirmed at checkout.
            </p>

            <Button
              onClick={() =>
                toast("Checkout coming soon", {
                  description: "Secure payments are on their way. Your cart is saved on this device.",
                })
              }
              className="mt-8 h-12 w-full gap-2.5 text-xs font-semibold uppercase tracking-[0.25em]"
            >
              <Lock aria-hidden className="size-4" />
              Secure checkout
            </Button>

            <ul className="mt-8 space-y-3 border-t border-border pt-6 text-xs text-muted-foreground">
              <li className="flex items-center gap-3">
                <Truck aria-hidden className="size-4 text-gold" strokeWidth={1.5} />
                Free insured shipping across India
              </li>
              <li className="flex items-center gap-3">
                <RotateCcw aria-hidden className="size-4 text-gold" strokeWidth={1.5} />
                Easy 15-day returns
              </li>
              <li className="flex items-center gap-3">
                <BadgeCheck aria-hidden className="size-4 text-gold" strokeWidth={1.5} />
                100% authentic, 2-year warranty
              </li>
            </ul>
          </div>
        </aside>
      </div>
    </MotionConfig>
  );
}

function EmptyCart() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center border border-border bg-card/40 px-6 py-20 text-center md:py-28"
    >
      <span className="grid size-16 place-items-center rounded-full border border-gold/30 text-gold">
        <ShoppingBag aria-hidden className="size-6" strokeWidth={1.25} />
      </span>
      <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-gold">Your cart is empty</p>
      <h2 className="mt-3 font-serif text-3xl font-light md:text-4xl">Time to find your next piece</h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        From precision chronographs to understated dress watches, our collection is curated to last a
        lifetime.
      </p>
      <Button asChild className="mt-10 h-12 px-8 text-xs font-semibold uppercase tracking-[0.25em]">
        <Link href="/shop">
          Explore the collection
          <ArrowRight aria-hidden className="size-4" />
        </Link>
      </Button>
    </motion.div>
  );
}

function CartSkeleton() {
  return (
    <div role="status" aria-label="Loading your cart" className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_400px] lg:gap-16 xl:gap-24">
      <div>
        <div className="flex justify-between border-b border-border pb-5">
          <Bone className="h-3 w-32" />
          <Bone className="h-3 w-14" />
        </div>
        {Array.from({ length: 2 }, (_, i) => (
          <div key={i} className="flex gap-4 border-b border-border py-6 sm:gap-6 sm:py-8">
            <Bone className="aspect-[4/5] w-24 shrink-0 sm:w-32" />
            <div className="flex flex-1 flex-col gap-3">
              <Bone className="h-2.5 w-20" />
              <Bone className="h-5 w-2/3" />
              <Bone className="h-4 w-24" />
              <Bone className="mt-auto h-9 w-28" />
            </div>
          </div>
        ))}
      </div>
      <Bone className="h-[26rem] rounded-lg" />
      <span className="sr-only">Loading…</span>
    </div>
  );
}
