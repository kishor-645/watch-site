import Image from "next/image";
import Link from "next/link";
import { QuickViewButton } from "@/components/interactive/quick-view";
import { toSnapshot, type QuickViewWatch } from "@/components/interactive/types";
import { WishlistButton } from "@/components/interactive/wishlist";
import type { CurrencyOptions } from "@/lib/format";
import { productPath } from "@/lib/site-url";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AvailabilityBadge } from "./availability";
import { Price } from "./price";

export type ProductCardWatch = Pick<
  Watch,
  "slug" | "name" | "brand" | "modelNumber" | "price" | "originalPrice" | "availability" | "images" | "shortDescription"
> & {
  specs?: Partial<Pick<Watch["specs"], "caseSize" | "movementDetail">>;
};

interface ProductCardProps {
  watch: ProductCardWatch;
  currency: CurrencyOptions;
  /** Server-built WhatsApp enquiry link for this watch (`watchEnquiryUrl`), used by quick view. */
  enquiryUrl: string;
  /** Eagerly load the primary image (only for the LCP card). */
  priority?: boolean;
  /** Responsive `sizes` hint matching the grid the card is rendered in. */
  sizes?: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

function toQuickView(w: ProductCardWatch): QuickViewWatch {
  return {
    slug: w.slug,
    name: w.name,
    brand: w.brand,
    modelNumber: w.modelNumber,
    price: w.price,
    originalPrice: w.originalPrice ?? null,
    availability: w.availability,
    shortDescription: w.shortDescription,
    images: w.images.slice(0, 4).map(({ url, alt }) => ({ url, alt })),
    caseSize: w.specs?.caseSize ?? "",
    movementDetail: w.specs?.movementDetail ?? "",
  };
}

/**
 * Server-rendered product tile: rounded card, image zoom + hover image swap (CSS only), glow on
 * hover. Quick view and wishlist controls sit over the image but outside every link (no nested
 * interactive content). The info block comes first in the DOM (title link is the first tab stop)
 * and is shown below the image with `flex-col-reverse`.
 */
export function ProductCard({
  watch,
  currency,
  enquiryUrl,
  priority = false,
  sizes = DEFAULT_SIZES,
  headingLevel: Heading = "h3",
  className,
}: ProductCardProps) {
  const href = productPath(watch.slug);
  const [primary, secondary] = watch.images;
  const caseSize = watch.specs?.caseSize?.trim();

  return (
    <article
      className={cn(
        "card-glow group relative flex h-full flex-col-reverse rounded-[1.375rem] border border-foreground/[0.07] bg-card p-1.5 sm:p-2",
        className,
      )}
    >
      <div className="flex flex-1 flex-col px-2 pb-2.5 pt-3.5 sm:px-2.5 sm:pb-3 sm:pt-4">
        <p className="eyebrow truncate text-brand-ink">{watch.brand}</p>
        <Heading className="type-card mt-1.5 line-clamp-2 text-foreground">
          <Link
            href={href}
            className="rounded-sm decoration-foreground/40 decoration-1 underline-offset-4 group-hover:underline"
          >
            {watch.name}
          </Link>
        </Heading>
        {caseSize && <p className="type-small mt-1 text-muted-foreground">{caseSize}</p>}
        <Price price={watch.price} originalPrice={watch.originalPrice} currency={currency} className="mt-auto pt-3" />
      </div>

      <div className="relative">
        {/* Duplicate image link for pointer users; keyboard/screen-reader users get the title link. */}
        <Link
          href={href}
          tabIndex={-1}
          aria-hidden
          data-cursor="view"
          className="relative block aspect-[4/5] overflow-hidden rounded-[1rem] bg-surface-2"
        >
          {primary && (
            <Image
              src={primary.url}
              alt={primary.alt || watch.name}
              fill
              priority={priority}
              sizes={sizes}
              className={cn(
                "object-cover transition-[opacity,transform] duration-700 ease-quiet motion-safe:group-hover:scale-[1.06]",
                secondary && "group-hover:opacity-0",
              )}
            />
          )}
          {secondary && (
            // Hover image: only displayed on hover-capable pointers. A lazy image with display:none is
            // never fetched, so touch devices don't download it.
            <Image
              src={secondary.url}
              alt=""
              fill
              loading="lazy"
              sizes={sizes}
              className="hidden object-cover opacity-0 transition-[opacity,transform] duration-700 ease-quiet group-hover:opacity-100 motion-safe:group-hover:scale-[1.06] [@media(hover:hover)]:block"
            />
          )}
          <span aria-hidden className="absolute inset-x-0 bottom-0 h-1/3 bg-gradient-to-t from-black/45 to-transparent" />
        </Link>

        <div className="pointer-events-none absolute inset-x-2 top-2 flex items-start justify-between gap-2 sm:inset-x-3 sm:top-3">
          <AvailabilityBadge
            availability={watch.availability}
            className="rounded-full border border-foreground/10 bg-background/95 px-2.5 py-1 text-[0.6875rem]"
          />
          <div className="pointer-events-auto relative z-10">
            <WishlistButton watch={toSnapshot(watch)} variant="icon" />
          </div>
        </div>

        {/* QuickViewButton handles its own reveal (hover/focus on desktop, always shown on touch). */}
        <div className="absolute inset-x-2 bottom-2 z-10 flex justify-center sm:inset-x-3 sm:bottom-3">
          <QuickViewButton watch={toQuickView(watch)} currency={currency} enquiryUrl={enquiryUrl} />
        </div>
      </div>
    </article>
  );
}
