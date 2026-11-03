import { availabilityLabels, type Availability } from "@/lib/schemas/watch";
import { cn } from "@/lib/utils";

const TONE: Record<Availability, string> = {
  in_stock: "text-success",
  limited: "text-warning",
  pre_order: "text-info",
  sold_out: "text-muted-foreground",
};

/** Availability as text with a small status dot (colour is never the only signal). */
export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <span className={cn("inline-flex items-center gap-2 text-[0.8125rem] font-medium", TONE[availability], className)}>
      <span aria-hidden className="size-1.5 shrink-0 rounded-full bg-current" />
      {availabilityLabels[availability]}
    </span>
  );
}

/** schema.org ItemAvailability for JSON-LD offers. */
export const schemaAvailability: Record<Availability, string> = {
  in_stock: "https://schema.org/InStock",
  limited: "https://schema.org/LimitedAvailability",
  pre_order: "https://schema.org/PreOrder",
  sold_out: "https://schema.org/OutOfStock",
};
