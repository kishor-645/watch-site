"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect } from "react";
import { Watch } from "lucide-react";
import { formatPrice, type CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { recentStore, useMounted } from "./store";
import type { WatchSnapshot } from "./types";

/** Records the current product page in "recently viewed" (renders nothing). */
export function RecentlyViewedTracker({ watch }: { watch: WatchSnapshot }) {
  useEffect(() => {
    recentStore.upsertFront(watch);
    // Re-record only when the product changes, not on every parent render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watch.slug]);
  return null;
}

/** Horizontal rail of recently viewed watches; renders nothing when empty. */
export function RecentlyViewedRail({
  currency,
  excludeSlug,
  className,
  title = "Recently viewed",
}: {
  currency: CurrencyOptions;
  excludeSlug?: string;
  className?: string;
  /** Optional heading text. */
  title?: string;
}) {
  const mounted = useMounted();
  const all = recentStore.useList();
  useEffect(() => {
    void recentStore.refresh();
  }, []);
  const items = mounted ? all.filter((w) => w.slug !== excludeSlug) : [];
  if (items.length === 0) return null;

  return (
    <section aria-labelledby="recently-viewed-title" className={cn("fade-up", className)}>
      <div className="mb-5 flex items-end justify-between gap-4">
        <h2 id="recently-viewed-title" className="type-h2">
          {title}
        </h2>
        <button
          type="button"
          onClick={() => recentStore.write([])}
          className="type-small text-muted-foreground underline-offset-4 hover:text-foreground hover:underline"
        >
          Clear
        </button>
      </div>
      <ul
        className="no-scrollbar -mx-4 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-4 px-4 pb-2"
        aria-label={title}
      >
        {items.map((w) => (
          <li key={w.slug} className="w-[10.5rem] shrink-0 snap-start sm:w-52">
            <Link
              href={`/watches/${w.slug}`}
              data-cursor="view"
              className="lift group flex h-full flex-col overflow-hidden rounded-2xl border border-border bg-card"
            >
              <div className="zoom-img relative aspect-square overflow-hidden bg-surface-2">
                {w.image ? (
                  <Image src={w.image} alt={w.imageAlt} fill sizes="208px" className="object-cover" />
                ) : (
                <Watch aria-hidden className="absolute inset-0 m-auto size-10 text-muted-foreground/50" strokeWidth={1.25} />
              )}
              </div>
              <div className="flex flex-1 flex-col gap-1 p-3">
                <span className="eyebrow text-muted-foreground">{w.brand}</span>
                <span className="type-small line-clamp-2 font-medium text-foreground">{w.name}</span>
                <span className="type-price-md mt-auto pt-1">{formatPrice(w.price, currency)}</span>
              </div>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}
