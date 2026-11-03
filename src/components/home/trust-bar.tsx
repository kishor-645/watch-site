import { Check } from "lucide-react";
import { container } from "@/components/home/section-heading";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Trust points from Admin → Settings → Home as numbered glass cards. Renders nothing when none are configured. */
export function TrustBar({ items, className }: { items: SiteSettings["home"]["trustItems"]; className?: string }) {
  if (!items.length) return null;
  return (
    <section aria-label="Why buy from us" className={cn("py-section", className)}>
      <ul
        className={cn(
          container,
          "grid grid-cols-2 gap-3 sm:gap-5",
          items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "",
        )}
      >
        {items.map((item, i) => (
          <li
            key={item.title}
            className="card-glow group relative overflow-hidden rounded-[1.375rem] border border-foreground/[0.07] bg-card p-4 sm:p-7"
          >
            <span aria-hidden className="text-aurora font-display text-sm font-bold tabular-nums tracking-[0.08em]">
              {String(i + 1).padStart(2, "0")}
            </span>
            <p className="mt-5 font-display text-base font-semibold leading-snug tracking-[-0.01em] text-foreground sm:mt-10 sm:text-lg">{item.title}</p>
            {item.description && <p className="type-small mt-2 text-muted-foreground">{item.description}</p>}
            <span
              aria-hidden
              className="pointer-events-none absolute -right-20 -top-20 size-52 rounded-full bg-[radial-gradient(closest-side,color-mix(in_oklab,var(--brand)_15%,transparent)_35%,transparent)] transition-opacity duration-500 group-hover:opacity-100 sm:opacity-60"
            />
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Up to three trust titles as compact chips (product page, under the enquiry button). */
export function TrustList({ items, className }: { items: SiteSettings["home"]["trustItems"]; className?: string }) {
  const shown = items.slice(0, 3);
  if (!shown.length) return null;
  return (
    <ul aria-label="Why buy from us" className={cn("flex flex-wrap gap-2", className)}>
      {shown.map((item) => (
        <li
          key={item.title}
          className="inline-flex items-center gap-2 rounded-full border border-foreground/[0.08] bg-card px-3 py-1.5 text-[0.8125rem] text-foreground"
        >
          <Check aria-hidden className="size-3.5 text-brand-ink" strokeWidth={2.5} />
          {item.title}
        </li>
      ))}
    </ul>
  );
}
