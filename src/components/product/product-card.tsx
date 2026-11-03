import Image from "next/image";
import Link from "next/link";
import type { CurrencyOptions } from "@/lib/format";
import { productPath } from "@/lib/site-url";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AvailabilityBadge } from "./availability";
import { Price } from "./price";

interface ProductCardProps {
  watch: Pick<Watch, "slug" | "name" | "brand" | "price" | "originalPrice" | "availability" | "images"> & {
    specs?: Pick<Watch["specs"], "caseSize">;
  };
  currency: CurrencyOptions;
  /** Eagerly load the primary image (only for the LCP card). */
  priority?: boolean;
  /** Responsive `sizes` hint matching the grid the card is rendered in. */
  sizes?: string;
  headingLevel?: "h2" | "h3";
  className?: string;
}

const DEFAULT_SIZES = "(min-width: 1280px) 22vw, (min-width: 768px) 30vw, 50vw";

/** Server-rendered product tile. Hover swaps to the second image (CSS only). */
export function ProductCard({
  watch,
  currency,
  priority = false,
  sizes = DEFAULT_SIZES,
  headingLevel: Heading = "h3",
  className,
}: ProductCardProps) {
  const href = productPath(watch.slug);
  const [primary, secondary] = watch.images;
  const caseSize = watch.specs?.caseSize?.trim();

  return (
    <article className={cn("group relative flex flex-col", className)}>
      {/* Duplicate image link for pointer users; keyboard/screen-reader users get the title link. */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/5] overflow-hidden bg-surface-2"
      >
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt || watch.name}
            fill
            priority={priority}
            sizes={sizes}
            className={cn(
              "object-cover mix-blend-multiply transition-[opacity,transform] duration-600 ease-quiet motion-safe:group-hover:scale-[1.03]",
              secondary && "group-hover:opacity-0",
            )}
          />
        )}
        {secondary && (
          // Hover image: only displayed on hover-capable pointers. A lazy image with display:none is
          // never fetched, so touch devices don't download it. (Tailwind v4's group-hover is also
          // limited to (hover: hover), so the primary image never fades out on touch.)
          <Image
            src={secondary.url}
            alt=""
            fill
            loading="lazy"
            sizes={sizes}
            className="hidden object-cover opacity-0 mix-blend-multiply transition-[opacity,transform] duration-600 ease-quiet group-hover:opacity-100 motion-safe:group-hover:scale-[1.03] [@media(hover:hover)]:block"
          />
        )}
      </Link>

      <div className="flex flex-1 flex-col pt-4">
        <p className="eyebrow text-muted-foreground">{watch.brand}</p>
        <Heading className="type-card mt-1 line-clamp-2 text-foreground">
          <Link
            href={href}
            className="rounded-sm decoration-1 underline-offset-4 group-hover:underline"
          >
            {watch.name}
          </Link>
        </Heading>
        {caseSize && <p className="type-small mt-0.5 text-muted-foreground">{caseSize}</p>}
        <Price price={watch.price} originalPrice={watch.originalPrice} currency={currency} className="mt-2" />
        {watch.availability !== "in_stock" && (
          <p className="mt-1">
            <AvailabilityBadge availability={watch.availability} />
          </p>
        )}
      </div>
    </article>
  );
}
