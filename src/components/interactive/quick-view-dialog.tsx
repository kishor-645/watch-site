"use client";
import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ArrowRight } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { WhatsAppIcon } from "@/components/site/icons";
import { formatPrice, type CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";
import { availabilityText } from "./store";
import type { QuickViewWatch, WatchSnapshot } from "./types";
import { WishlistButton } from "./wishlist";

/**
 * Quick-view modal body. Loaded on demand by <QuickViewButton> (quick-view.tsx) the first time a
 * card's trigger is hovered, focused or pressed, so the dialog code stays out of the initial bundle.
 */
export function QuickViewDialog({
  watch,
  currency,
  enquiryUrl,
  open,
  onOpenChange,
  triggerRef,
}: {
  watch: QuickViewWatch;
  currency: CurrencyOptions;
  enquiryUrl: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const [index, setIndex] = useState(0);
  const images = watch.images;
  const current = images[Math.min(index, Math.max(images.length - 1, 0))];
  const snapshot = useMemo<WatchSnapshot>(
    () => ({
      slug: watch.slug,
      name: watch.name,
      brand: watch.brand,
      price: watch.price,
      originalPrice: watch.originalPrice ?? null,
      availability: watch.availability,
      image: images[0]?.url ?? null,
      imageAlt: images[0]?.alt || watch.name,
    }),
    [watch, images],
  );
  const onSale = watch.originalPrice != null && watch.originalPrice > watch.price;
  const soldOut = watch.availability === "sold_out";

  return (
    // React bubbles portal events (overlay + content) to React ancestors such as a card <Link>: stop them here.
    <span className="contents" onClick={(e) => e.stopPropagation()}>
      <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-4xl gap-0 p-0 sm:rounded-[1.75rem]"
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <div className="grid md:grid-cols-[1.05fr_1fr]">
          {/* Gallery */}
          <div className="flex flex-col gap-3 bg-surface-2 p-4 sm:p-5">
            <div className="relative aspect-square overflow-hidden rounded-2xl bg-background/40">
              {current ? (
                <Image
                  key={current.url}
                  src={current.url}
                  alt={current.alt || watch.name}
                  fill
                  sizes="(min-width: 768px) 440px, 90vw"
                  className="fade-in object-cover"
                  priority
                />
              ) : null}
            </div>
            {images.length > 1 && (
              <div className="no-scrollbar flex gap-2 overflow-x-auto" role="group" aria-label="Images">
                {images.map((img, i) => (
                  <button
                    key={img.url + i}
                    type="button"
                    onClick={() => setIndex(i)}
                    aria-label={`Show image ${i + 1} of ${images.length}`}
                    aria-current={i === index ? "true" : undefined}
                    className={cn(
                      "relative size-16 shrink-0 overflow-hidden rounded-xl border-2 transition-[border-color,opacity] duration-200",
                      i === index ? "border-brand-ink" : "border-transparent opacity-70 hover:opacity-100",
                    )}
                  >
                    <Image src={img.url} alt="" fill sizes="64px" className="object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Details */}
          <div className="flex flex-col gap-4 p-6 sm:p-8">
            <div className="flex flex-col gap-1.5 pr-10">
              <span className="eyebrow text-brand-ink">{watch.brand}</span>
              <DialogTitle className="text-2xl font-semibold leading-tight tracking-tight sm:text-[1.75rem]">{watch.name}</DialogTitle>
              {watch.modelNumber ? (
                <span className="type-small text-muted-foreground">Ref. {watch.modelNumber}</span>
              ) : null}
            </div>

            <div className="flex flex-wrap items-baseline gap-3">
              <span className="type-price-lg">{formatPrice(watch.price, currency)}</span>
              {onSale ? (
                <s className="type-small text-muted-foreground">
                  <span className="sr-only">Was </span>
                  {formatPrice(watch.originalPrice as number, currency)}
                </s>
              ) : null}
            </div>

            <span className="inline-flex w-fit items-center gap-2 rounded-full border border-border bg-background/40 px-3 py-1 text-xs font-medium">
              <span
                aria-hidden
                className={cn("size-2 rounded-full", soldOut ? "bg-destructive" : watch.availability === "in_stock" ? "bg-success" : "bg-warning")}
              />
              {availabilityText[watch.availability]}
            </span>

            <DialogDescription className="type-body text-muted-foreground line-clamp-4">
              {watch.shortDescription || `${watch.brand} ${watch.name}`}
            </DialogDescription>

            {(watch.caseSize || watch.movementDetail) && (
              <dl className="grid grid-cols-2 gap-3 rounded-2xl border border-border p-4 text-sm">
                {watch.caseSize ? (
                  <div>
                    <dt className="eyebrow text-muted-foreground">Case</dt>
                    <dd className="mt-1 font-medium">{watch.caseSize}</dd>
                  </div>
                ) : null}
                {watch.movementDetail ? (
                  <div>
                    <dt className="eyebrow text-muted-foreground">Movement</dt>
                    <dd className="mt-1 font-medium">{watch.movementDetail}</dd>
                  </div>
                ) : null}
              </dl>
            )}

            <div className="mt-auto flex flex-col gap-3 pt-2">
              <a
                href={enquiryUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="press shine inline-flex h-12 items-center justify-center gap-2 rounded-full bg-primary px-6 text-sm font-semibold text-primary-foreground"
              >
                <WhatsAppIcon className="size-4" />
                Check availability
              </a>
              <div className="flex gap-3">
                <Link
                  href={`/watches/${watch.slug}`}
                  onClick={() => onOpenChange(false)}
                  className="press inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full border border-border px-5 text-sm font-medium transition-colors hover:border-foreground/60"
                >
                  View details
                  <ArrowRight aria-hidden className="size-4" />
                </Link>
                <WishlistButton watch={snapshot} className="size-12 shrink-0" />
              </div>
            </div>
          </div>
        </div>
      </DialogContent>
      </Dialog>
    </span>
  );
}
