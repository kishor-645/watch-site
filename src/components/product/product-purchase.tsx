"use client";

import { useEffect, useRef, useState } from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { ShoppingBag } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { PDP_END_ID } from "./constants";
import { QuantityStepper } from "./quantity-stepper";


export function ProductPurchase({ watch }: { watch: Watch }) {
  const router = useRouter();
  const { addItem } = useCart();
  const [quantity, setQuantity] = useState(1);
  const ctaRef = useRef<HTMLDivElement>(null);
  const showBar = useStickyBar(ctaRef);

  const addToCart = (qty = quantity) => {
    addItem(watch.id, qty);
    toast.success("Added to your cart", {
      description: `${watch.name}${qty > 1 ? ` × ${qty}` : ""}`,
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  };

  const buyNow = () => {
    addItem(watch.id, quantity);
    router.push("/cart");
  };

  return (
    <>
      <div className="space-y-6">
        <StockStatus inStock={watch.inStock} />

        <div ref={ctaRef} className="flex flex-col gap-3 sm:flex-row">
          <QuantityStepper value={quantity} onChange={setQuantity} className="self-start" />
          <Button
            onClick={() => addToCart()}
            disabled={!watch.inStock}
            className="h-12 flex-1 gap-2.5 text-xs font-semibold uppercase tracking-[0.25em]"
          >
            <ShoppingBag aria-hidden className="size-4" />
            Add to Cart
          </Button>
        </div>
        <Button
          variant="outline"
          onClick={buyNow}
          disabled={!watch.inStock}
          className="h-12 w-full border-gold/40 text-xs font-semibold uppercase tracking-[0.25em] hover:border-gold hover:bg-gold/5 hover:text-gold"
        >
          Buy Now
        </Button>
      </div>

      {/* Mobile sticky add-to-cart bar */}
      <AnimatePresence>
        {showBar && (
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-x-0 bottom-0 z-40 border-t border-gold/20 bg-background/90 pb-[env(safe-area-inset-bottom)] backdrop-blur-xl lg:hidden"
          >
            <div className="mx-auto flex max-w-3xl items-center gap-3 px-4 py-3">
              {watch.images[0] && (
                <div className="relative size-12 shrink-0 overflow-hidden rounded-md border border-border bg-card">
                  <Image src={watch.images[0]} alt="" fill sizes="48px" className="object-cover" />
                </div>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-serif text-base leading-tight">{watch.name}</p>
                <p className="text-sm tabular-nums text-gold">{formatPrice(watch.price)}</p>
              </div>
              <Button
                onClick={() => addToCart(1)}
                disabled={!watch.inStock}
                className="h-11 gap-2 px-5 text-[11px] font-semibold uppercase tracking-[0.2em]"
              >
                <ShoppingBag aria-hidden className="size-4" />
                Add
                <span className="sr-only"> {watch.name} to cart</span>
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

function StockStatus({ inStock }: { inStock: boolean }) {
  return (
    <p className="flex items-center gap-2.5 text-sm">
      <span className="relative flex size-2">
        {inStock && (
          <span className="absolute inline-flex size-full animate-ping rounded-full bg-emerald-400/60 motion-reduce:animate-none" />
        )}
        <span
          className={cn(
            "relative inline-flex size-2 rounded-full",
            inStock ? "bg-emerald-400" : "bg-muted-foreground",
          )}
        />
      </span>
      {inStock ? (
        <span>
          In stock <span className="text-muted-foreground">— dispatched within 24 hours</span>
        </span>
      ) : (
        <span className="text-muted-foreground">Currently unavailable — back soon</span>
      )}
    </p>
  );
}

/** Shows the bar once the main CTA has scrolled above the viewport, until the page end is reached. */
function useStickyBar(ctaRef: React.RefObject<HTMLDivElement | null>) {
  const [show, setShow] = useState(false);

  useEffect(() => {
    const cta = ctaRef.current;
    if (!cta) return;
    let ctaAbove = false;
    let endReached = false;
    const sync = () => setShow(ctaAbove && !endReached);

    const ctaObserver = new IntersectionObserver(([entry]) => {
      ctaAbove = !entry.isIntersecting && entry.boundingClientRect.top < 0;
      sync();
    });
    ctaObserver.observe(cta);

    const end = document.getElementById(PDP_END_ID);
    const endObserver = new IntersectionObserver(([entry]) => {
      endReached = entry.isIntersecting || entry.boundingClientRect.top < 0;
      sync();
    });
    if (end) endObserver.observe(end);

    return () => {
      ctaObserver.disconnect();
      endObserver.disconnect();
    };
  }, [ctaRef]);

  return show;
}
