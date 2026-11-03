"use client";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { Heart, Watch, X } from "lucide-react";
import { toast } from "sonner";
import { formatPrice, type CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { availabilityText, useMounted, useWishlistToggle, wishlistStore } from "./store";
import type { WatchSnapshot } from "./types";

/** Heart toggle for a watch (localStorage). `variant="full"` renders a labelled button for the product page. */
export function WishlistButton({
  watch,
  variant = "icon",
  className,
}: {
  watch: WatchSnapshot;
  variant?: "icon" | "full";
  className?: string;
}) {
  const mounted = useMounted();
  const { saved: savedRaw, toggle } = useWishlistToggle(watch);
  const saved = mounted && savedRaw;
  const [pop, setPop] = useState(0);
  const router = useRouter();
  // Constant accessible name; state is conveyed by aria-pressed.
  const label = "Save to wishlist";

  function onClick(e: React.MouseEvent) {
    // Cards are often wrapped in links: never navigate.
    e.preventDefault();
    e.stopPropagation();
    const added = toggle();
    setPop((n) => n + 1);
    if (added) {
      toast.success("Saved to your wishlist", {
        description: `${watch.brand} ${watch.name}`,
        action: { label: "View", onClick: () => router.push("/wishlist") },
      });
    } else {
      toast("Removed from your wishlist", {
        description: `${watch.brand} ${watch.name}`,
        action: { label: "Undo", onClick: () => wishlistStore.upsertFront(watch) },
      });
    }
  }

  const heart = (
    <Heart
      key={pop}
      aria-hidden
      className={cn("size-[1.1em] shrink-0", pop > 0 && "heart-pop", saved ? "fill-hot text-hot" : "fill-transparent")}
      strokeWidth={1.75}
    />
  );

  if (variant === "full") {
    return (
      <button
        type="button"
        onClick={onClick}
        aria-pressed={saved}
        className={cn(
          "press inline-flex h-12 items-center justify-center gap-2 rounded-full border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors duration-200 ease-quiet hover:border-foreground/60",
          saved && "border-hot/60",
          className,
        )}
      >
        {heart}
        <span>{saved ? "Saved to wishlist" : label}</span>
      </button>
    );
  }

  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={saved}
      aria-label={label}
      title={label}
      className={cn(
        "press inline-flex size-10 items-center justify-center rounded-full border border-white/15 bg-background/70 text-lg text-foreground backdrop-blur-md transition-colors duration-200 ease-quiet hover:border-foreground/50 hover:bg-background/90",
        className,
      )}
    >
      {heart}
    </button>
  );
}

/** Header link to /wishlist with a live count badge. */
export function WishlistNavLink({ className }: { className?: string }) {
  const mounted = useMounted();
  const list = wishlistStore.useList();
  const count = mounted ? list.length : 0;
  return (
    <Link
      href="/wishlist"
      aria-label={`Wishlist (${count})`}
      className={cn(
        "relative inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-surface-2",
        className,
      )}
    >
      <Heart aria-hidden className="size-5" strokeWidth={1.75} />
      {count > 0 && (
        <span
          key={count}
          aria-hidden
          className="badge-pop absolute -right-0.5 -top-0.5 inline-flex min-w-[1.125rem] items-center justify-center rounded-full bg-hot px-1 text-[0.625rem] font-semibold leading-[1.125rem] text-[#0a0e1c] tabular-nums"
        >
          {count > 99 ? "99+" : count}
        </span>
      )}
    </Link>
  );
}

/** Client list for /wishlist. */
export function WishlistList({ currency }: { currency: CurrencyOptions }) {
  const mounted = useMounted();
  const list = wishlistStore.useList();
  // Show current prices/availability; drops watches that were removed from the shop.
  useEffect(() => {
    void wishlistStore.refresh();
  }, []);

  if (!mounted) {
    return <div className="min-h-[40vh]" aria-busy="true" />;
  }

  if (list.length === 0) {
    return (
      <div className="fade-up mx-auto flex max-w-md flex-col items-center gap-5 rounded-3xl border border-border bg-card px-6 py-14 text-center">
        <span className="inline-flex size-14 items-center justify-center rounded-full bg-surface-2">
          <Heart aria-hidden className="size-6 text-hot-ink" strokeWidth={1.75} />
        </span>
        <h2 className="type-h3">Your wishlist is empty</h2>
        <p className="type-body text-muted-foreground">
          Tap the heart on any watch to save it here for later.
        </p>
        <Link
          href="/shop"
          className="press inline-flex h-12 items-center rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
        >
          Browse the shop
        </Link>
      </div>
    );
  }

  return (
    <>
      <p role="status" className="type-small mb-6 text-muted-foreground">
        {list.length === 1 ? "1 saved watch" : `${list.length} saved watches`}
      </p>
      <ul className="grid grid-cols-2 gap-4 sm:gap-6 lg:grid-cols-4" aria-label="Saved watches">
        {list.map((w, i) => (
          <li
            key={w.slug}
            className="fade-up lift group relative flex flex-col overflow-hidden rounded-2xl border border-border bg-card"
            style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
          >
            <Link href={`/watches/${w.slug}`} className="flex flex-1 flex-col" data-cursor="view">
              <div className="zoom-img relative aspect-square overflow-hidden bg-surface-2">
                {w.image ? (
                  <Image src={w.image} alt={w.imageAlt} fill sizes="(min-width:1024px) 25vw, 50vw" className="object-cover" />
                ) : (
                <Watch aria-hidden className="absolute inset-0 m-auto size-10 text-muted-foreground/50" strokeWidth={1.25} />
              )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-4">
                <span className="eyebrow text-muted-foreground">{w.brand}</span>
                <h3 className="type-card line-clamp-2">{w.name}</h3>
                <span className="type-small text-muted-foreground">{availabilityText[w.availability]}</span>
                <span className="mt-auto flex items-baseline gap-2 pt-2">
                  <span className="type-price-md">{formatPrice(w.price, currency)}</span>
                  {w.originalPrice && w.originalPrice > w.price ? (
                    <s className="type-small text-muted-foreground">
                      <span className="sr-only">Was </span>
                      {formatPrice(w.originalPrice, currency)}
                    </s>
                  ) : null}
                </span>
              </div>
            </Link>
            <button
              type="button"
              onClick={() => {
                wishlistStore.remove(w.slug);
                toast("Removed from your wishlist", {
                  description: `${w.brand} ${w.name}`,
                  action: { label: "Undo", onClick: () => wishlistStore.upsertFront(w) },
                });
              }}
              aria-label={`Remove ${w.name} from wishlist`}
              className="press absolute right-3 top-3 inline-flex size-9 items-center justify-center rounded-full border border-white/15 bg-background/75 text-foreground backdrop-blur-md transition-colors hover:bg-background"
            >
              <X aria-hidden className="size-4" />
            </button>
          </li>
        ))}
      </ul>
    </>
  );
}
