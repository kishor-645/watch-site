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
  return (
    <p className={cn("flex flex-wrap items-baseline gap-x-3 gap-y-1", className)}>
      <span
        className={cn(
          "font-serif font-semibold tabular-nums",
          size === "lg" ? "text-4xl text-foreground" : "text-lg tracking-wide text-gold",
        )}
      >
        <span className="sr-only">Price: </span>
        {formatPrice(price, currency)}
      </span>
      {discount != null && originalPrice != null && (
        <>
          <s className={cn("tabular-nums text-muted-foreground", size === "lg" ? "text-lg" : "text-sm")}>
            <span className="sr-only">Original price: </span>
            {formatPrice(originalPrice, currency)}
          </s>
          <span
            className={cn(
              "font-medium uppercase tracking-[0.15em] text-gold",
              size === "lg"
                ? "rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[0.7rem]"
                : "text-[0.65rem]",
            )}
          >
            {discount}% off
          </span>
        </>
      )}
    </p>
  );
}
