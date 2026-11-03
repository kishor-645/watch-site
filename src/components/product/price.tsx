import { discountPercent, formatPrice, type CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Selling price, struck-through original price and a hot discount pill, with screen-reader context. */
export function Price({
  price,
  originalPrice,
  currency,
  size = "md",
  className,
}: {
  price: number;
  originalPrice: number | null;
  currency: CurrencyOptions;
  size?: "md" | "lg";
  className?: string;
}) {
  const discount = discountPercent(price, originalPrice);
  const lg = size === "lg";
  return (
    <p className={cn("flex flex-wrap items-center gap-y-1.5", lg ? "gap-x-3" : "gap-x-2", className)}>
      <span className={cn("font-semibold text-foreground", lg ? "type-price-lg font-display" : "type-price-md")}>
        <span className="sr-only">Price: </span>
        {formatPrice(price, currency)}
      </span>
      {discount != null && originalPrice != null && (
        <>
          <s className={cn("tabular-nums text-muted-foreground", lg ? "text-base" : "text-[0.8125rem]")}>
            <span className="sr-only">Original price: </span>
            {formatPrice(originalPrice, currency)}
          </s>
          <span
            className={cn(
              "rounded-full bg-hot/15 font-semibold tabular-nums text-hot-ink ring-1 ring-inset ring-hot/30",
              lg ? "px-2.5 py-1 text-xs" : "px-2 py-0.5 text-[0.6875rem]",
            )}
          >
            {discount}% off
          </span>
        </>
      )}
    </p>
  );
}
