import { Star } from "lucide-react";
import { cn } from "@/lib/utils";

/** Five stars with a precise gold fill proportional to the rating. */
export function RatingStars({ rating, className }: { rating: number; className?: string }) {
  const pct = Math.max(0, Math.min(100, (rating / 5) * 100));
  const row = (filled: boolean) =>
    Array.from({ length: 5 }, (_, i) => (
      <Star
        key={i}
        aria-hidden
        strokeWidth={1.25}
        className={cn("size-full shrink-0", filled ? "fill-gold text-gold" : "text-gold/35")}
      />
    ));

  return (
    <span
      role="img"
      aria-label={`Rated ${rating.toFixed(1)} out of 5`}
      className={cn("relative inline-flex h-4 w-[5.5rem]", className)}
    >
      <span className="flex w-full gap-0.5">{row(false)}</span>
      <span className="absolute inset-y-0 left-0 overflow-hidden" style={{ width: `${pct}%` }}>
        <span className="flex h-full w-[5.5rem] gap-0.5">{row(true)}</span>
      </span>
    </span>
  );
}
