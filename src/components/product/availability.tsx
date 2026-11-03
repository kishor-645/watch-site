import { availabilityLabels, type Availability } from "@/lib/schemas/watch";
import { cn } from "@/lib/utils";

const DOT: Record<Availability, string> = {
  in_stock: "bg-emerald-400",
  limited: "bg-amber-400",
  pre_order: "bg-sky-400",
  sold_out: "bg-muted-foreground",
};

/** Small status pill: coloured dot + label (colour is never the only signal). */
export function AvailabilityBadge({
  availability,
  className,
}: {
  availability: Availability;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 rounded-full border border-border bg-background/75 px-2.5 py-1 text-[0.65rem] font-medium uppercase tracking-[0.18em] text-foreground/90 backdrop-blur-sm",
        className,
      )}
    >
      <span aria-hidden className={cn("size-1.5 rounded-full", DOT[availability])} />
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
