import { Marquee } from "@/components/motion/marquee";
import { cn } from "@/lib/utils";

/**
 * Infinite marquee of names (brands of the featured watches, then category labels). `Marquee`
 * renders the run twice (copy aria-hidden), pauses on hover and stands still for reduced motion.
 */
export function BrandTicker({ items, className }: { items: string[]; className?: string }) {
  const unique = [...new Set(items.map((i) => i.trim()).filter(Boolean))];
  if (unique.length < 2) return null;
  // Short lists are repeated so one run is wider than the viewport. Repeats are decorative:
  // hidden from screen readers and from reduced-motion users (who see a static, wrapped list).
  const run = (unique.length < 8 ? [...unique, ...unique] : unique).map((name, i) => ({ name, repeat: i >= unique.length }));

  return (
    <section
      aria-label="Brands and collections"
      className={cn("relative overflow-hidden border-y border-foreground/[0.08] bg-card/40 py-6 sm:py-8", className)}
    >
      <Marquee duration={45} gap="0px">
        {run.map(({ name, repeat }, i) => (
          <span
            key={`${name}-${i}`}
            className={cn("flex items-center", repeat && "motion-reduce:hidden")}
            aria-hidden={repeat || undefined}
          >
            <span className="whitespace-nowrap px-7 font-display text-[clamp(1.5rem,1.1rem+1.6vw,2.75rem)] font-bold uppercase leading-none tracking-[-0.03em] text-foreground/85 sm:px-10">
              {name}
            </span>
            <span aria-hidden className="text-aurora text-xl sm:text-2xl">
              ✦
            </span>
          </span>
        ))}
      </Marquee>
      <div aria-hidden className="pointer-events-none absolute inset-y-0 left-0 w-16 bg-gradient-to-r from-background to-transparent sm:w-32" />
      <div aria-hidden className="pointer-events-none absolute inset-y-0 right-0 w-16 bg-gradient-to-l from-background to-transparent sm:w-32" />
    </section>
  );
}
