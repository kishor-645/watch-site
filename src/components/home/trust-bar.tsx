import { BadgeCheck, RotateCcw, ShieldCheck, Truck } from "lucide-react";
import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

const ITEMS = [
  { Icon: BadgeCheck, title: "Authentic", text: "Certified, hand-inspected pieces" },
  { Icon: Truck, title: "Free Shipping", text: "Insured delivery across India" },
  { Icon: ShieldCheck, title: "2-Year Warranty", text: "Comprehensive international cover" },
  { Icon: RotateCcw, title: "Easy Returns", text: "14 days, no questions asked" },
];

export function TrustBar() {
  return (
    <section aria-label="Our promise" className="border-y border-gold/15 bg-charcoal/50">
      <ul className={cn(container, "grid grid-cols-2 lg:grid-cols-4")}>
        {ITEMS.map(({ Icon, title, text }, i) => (
          <li
            key={title}
            className={cn(
              "flex flex-col items-center gap-3 px-3 py-8 text-center sm:flex-row sm:items-center sm:gap-4 sm:text-left lg:justify-center lg:py-10",
              i % 2 === 1 && "border-l border-border",
              i >= 2 && "border-t border-border lg:border-t-0",
              i === 2 && "lg:border-l",
            )}
          >
            <span className="flex size-11 shrink-0 items-center justify-center rounded-full border border-gold/30 text-gold">
              <Icon className="size-5" strokeWidth={1.25} aria-hidden />
            </span>
            <span>
              <span className="block text-[0.7rem] font-medium uppercase tracking-[0.25em] text-foreground">{title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
