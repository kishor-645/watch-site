import { discountPercent, formatPrice, type CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Selling price, struck-through original price and discount, with screen-reader context. */
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
    <p className={cn("flex flex-wrap items-baseline gap-y-1", lg ? "gap-x-3" : "gap-x-2", className)}>
      <span className={cn("text-foreground", lg ? "type-price-lg" : "type-price-md")}>
        <span className="sr-only">Price: </span>
        {formatPrice(price, currency)}
      </span>
      {discount != null && originalPrice != null && (
        <>
          <s className={cn("tabular-nums text-muted-foreground", lg ? "text-base" : "text-[0.8125rem]")}>
            <span className="sr-only">Original price: </span>
            {formatPrice(originalPrice, currency)}
          </s>
          <span className={cn("font-medium tabular-nums text-brand-ink", lg ? "text-sm" : "text-xs")}>
            {discount}% off
          </span>
        </>
      )}
    </p>
  );
}
