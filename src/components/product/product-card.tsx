import Image from "next/image";
import Link from "next/link";
import type { CurrencyOptions } from "@/lib/format";
import { productPath } from "@/lib/site-url";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";
import { AvailabilityBadge } from "./availability";
import { Price } from "./price";

interface ProductCardProps {
  watch: Pick<Watch, "slug" | "name" | "brand" | "price" | "originalPrice" | "availability" | "images">;
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

  return (
    <article className={cn("group relative flex flex-col", className)}>
      <div className="relative">
      {/* Duplicate image link for pointer users; keyboard/screen-reader users get the title link. */}
      <Link
        href={href}
        tabIndex={-1}
        aria-hidden
        className="relative block aspect-[4/5] overflow-hidden rounded-sm border border-border bg-charcoal transition-colors duration-500 group-hover:border-gold/30"
      >
        {primary && (
          <Image
            src={primary.url}
            alt={primary.alt || watch.name}
            fill
            priority={priority}
            sizes={sizes}
            className={cn(
              "object-cover transition-[opacity,transform] duration-700 ease-out group-hover:scale-[1.03]",
              secondary && "group-hover:opacity-0",
            )}
          />
        )}
        {secondary && (
          <Image
            src={secondary.url}
            alt=""
            fill
            sizes={sizes}
            className="object-cover opacity-0 transition-opacity duration-700 ease-out group-hover:opacity-100"
          />
        )}
      </Link>
      {watch.availability !== "in_stock" && (
        <AvailabilityBadge availability={watch.availability} className="pointer-events-none absolute left-3 top-3" />
      )}
      </div>

      <div className="flex flex-1 flex-col pt-4">
        <p className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">{watch.brand}</p>
        <Heading className="mt-1.5 text-lg font-medium leading-snug text-foreground sm:text-xl">
          <Link href={href} className="rounded-sm transition-colors hover:text-gold-light">
            {watch.name}
          </Link>
        </Heading>
        <Price price={watch.price} originalPrice={watch.originalPrice} currency={currency} className="mt-2" />
      </div>
    </article>
  );
}
