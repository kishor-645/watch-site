"use client";

import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingBag, Star } from "lucide-react";
import { toast } from "sonner";
import { useCart } from "@/lib/cart-context";
import { formatPrice } from "@/lib/format";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ProductCardProps {
  watch: Watch;
  /** Eagerly load the primary image (use for above-the-fold cards). */
  priority?: boolean;
  /** Override the responsive `sizes` hint when the card is rendered at a non-grid width. */
  sizes?: string;
  className?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 25vw, (min-width: 768px) 33vw, 50vw";

export function ProductCard({ watch, priority = false, sizes = DEFAULT_SIZES, className }: ProductCardProps) {
  const { addItem } = useCart();
  const router = useRouter();
  const href = `/watches/${watch.slug}`;
  const hoverImage = watch.images[1];
  const discount =
    watch.compareAtPrice && watch.compareAtPrice > watch.price
      ? Math.round(((watch.compareAtPrice - watch.price) / watch.compareAtPrice) * 100)
      : 0;

  function handleAdd() {
    addItem(watch.id, 1);
    toast.success(`${watch.name} added to your cart`, {
      description: formatPrice(watch.price),
      action: { label: "View cart", onClick: () => router.push("/cart") },
    });
  }

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative overflow-hidden rounded-sm border border-border bg-charcoal transition-colors duration-500 group-hover:border-gold/30">
        <Link
          href={href}
          aria-label={`${watch.brand} ${watch.name}`}
          tabIndex={-1}
          className="relative block aspect-[4/5] outline-none"
        >
          <Image
            src={watch.images[0]}
            alt={`${watch.brand} ${watch.name}`}
            fill
            priority={priority}
            sizes={sizes}
            className={cn(
              "object-cover transition-all duration-700 ease-out group-hover:scale-[1.04]",
              hoverImage && "group-hover:opacity-0",
            )}
          />
          {hoverImage && (
            <Image
              src={hoverImage}
              alt=""
              aria-hidden
              fill
              sizes={sizes}
              className="scale-[1.04] object-cover opacity-0 transition-all duration-700 ease-out group-hover:scale-100 group-hover:opacity-100"
            />
          )}
          <span
            aria-hidden
            className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-60"
          />
        </Link>

        {/* Badges */}
        <div className="pointer-events-none absolute left-3 top-3 flex flex-col items-start gap-1.5">
          {watch.isFlagship && (
            <span className="bg-gold px-2 py-1 text-[0.6rem] font-semibold uppercase tracking-[0.2em] text-primary-foreground">
              Flagship
            </span>
          )}
          {watch.isNew && (
            <span className="border border-gold/50 bg-background/70 px-2 py-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-gold-light backdrop-blur-sm">
              New
            </span>
          )}
          {discount > 0 && (
            <span className="border border-border bg-background/70 px-2 py-1 text-[0.6rem] font-medium uppercase tracking-[0.2em] text-foreground backdrop-blur-sm">
              −{discount}%
            </span>
          )}
        </div>

        {/* Quick add: always visible on touch, revealed on hover / focus on larger screens */}
        <div className="absolute inset-x-3 bottom-3 transition-all duration-500 md:translate-y-3 md:opacity-0 md:group-hover:translate-y-0 md:group-hover:opacity-100 md:group-focus-within:translate-y-0 md:group-focus-within:opacity-100">
          <button
            type="button"
            onClick={handleAdd}
            disabled={!watch.inStock}
            aria-label={watch.inStock ? `Add ${watch.name} to cart` : `${watch.name} is sold out`}
            className="flex h-10 w-full items-center justify-center gap-2 border border-gold/40 bg-background/85 text-[0.65rem] font-medium uppercase tracking-[0.25em] text-foreground backdrop-blur-md transition-colors hover:border-gold hover:bg-gold hover:text-primary-foreground focus-visible:border-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold/60 disabled:cursor-not-allowed disabled:opacity-60 disabled:hover:bg-background/85 disabled:hover:text-foreground"
          >
            <ShoppingBag className="size-3.5" aria-hidden />
            {watch.inStock ? "Add to cart" : "Sold out"}
          </button>
        </div>
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.3em] text-muted-foreground">
          {watch.brand}
        </p>
        <h3 className="mt-1.5 text-xl font-medium leading-snug text-foreground">
          <Link
            href={href}
            className="rounded-sm outline-none transition-colors hover:text-gold-light focus-visible:ring-2 focus-visible:ring-gold/60"
          >
            {watch.name}
          </Link>
        </h3>
        <div className="mt-2 flex items-center gap-2">
          <RatingStars rating={watch.rating} />
          <span className="text-xs text-muted-foreground">({watch.reviewCount})</span>
        </div>
        <p className="mt-3 flex items-baseline gap-2.5">
          <span className="font-serif text-lg font-semibold tracking-wide text-gold">
            {formatPrice(watch.price)}
          </span>
          {discount > 0 && watch.compareAtPrice && (
            <span className="text-sm text-muted-foreground line-through">
              <span className="sr-only">Was </span>
              {formatPrice(watch.compareAtPrice)}
            </span>
          )}
        </p>
      </div>
    </article>
  );
}

/** Five stars with fractional gold fill; announced to screen readers as "Rated x out of 5". */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  const pct = Math.max(0, Math.min(5, rating)) * 20;
  return (
    <span role="img" aria-label={`Rated ${rating.toFixed(1)} out of 5`} className={cn("relative inline-flex", className)}>
      <span className="flex gap-0.5 text-foreground/20" aria-hidden>
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5" strokeWidth={1.5} />
        ))}
      </span>
      <span
        className="absolute inset-y-0 left-0 flex gap-0.5 overflow-hidden text-gold"
        style={{ width: `${pct}%` }}
        aria-hidden
      >
        {Array.from({ length: 5 }).map((_, i) => (
          <Star key={i} className="size-3.5 shrink-0 fill-current" strokeWidth={1.5} />
        ))}
      </span>
    </span>
  );
}
