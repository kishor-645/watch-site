import { Minus, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

export const MAX_QUANTITY = 10;

/** Accessible −/+ stepper. Used from client components only (takes a callback). */
export function QuantityStepper({
  value,
  onChange,
  min = 1,
  max = MAX_QUANTITY,
  label = "Quantity",
  size = "md",
  className,
}: {
  value: number;
  onChange: (next: number) => void;
  min?: number;
  max?: number;
  label?: string;
  size?: "sm" | "md";
  className?: string;
}) {
  const btn =
    "grid place-items-center text-foreground/70 transition-colors hover:text-gold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring/70 disabled:pointer-events-none disabled:opacity-30";
  const dims = size === "sm" ? "h-9 [&>button]:w-9" : "h-12 [&>button]:w-11";

  return (
    <div
      role="group"
      aria-label={label}
      className={cn("inline-flex items-stretch rounded-lg border border-border bg-background/40", dims, className)}
    >
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.max(min, value - 1))}
        disabled={value <= min}
        aria-label="Decrease quantity"
      >
        <Minus className="size-3.5" aria-hidden />
      </button>
      <output
        aria-live="polite"
        aria-label={`${label}: ${value}`}
        className={cn(
          "grid place-items-center border-x border-border font-medium tabular-nums",
          size === "sm" ? "w-9 text-sm" : "w-12",
        )}
      >
        {value}
      </output>
      <button
        type="button"
        className={btn}
        onClick={() => onChange(Math.min(max, value + 1))}
        disabled={value >= max}
        aria-label="Increase quantity"
      >
        <Plus className="size-3.5" aria-hidden />
      </button>
    </div>
  );
}
