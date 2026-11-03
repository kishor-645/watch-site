import { container } from "@/components/home/section-heading";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Trust points from Admin → Settings → Home. Renders nothing when none are configured. */
export function TrustBar({ items }: { items: SiteSettings["home"]["trustItems"] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Why buy from us" className="border-b border-gold/10 bg-charcoal/50">
      <ul
        className={cn(
          container,
          "grid grid-cols-1 gap-px sm:grid-cols-2",
          items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "",
        )}
      >
        {items.map((item) => (
          <li key={item.title} className="flex items-start gap-4 py-6 sm:px-2 lg:py-9">
            <span aria-hidden className="mt-2 size-1.5 shrink-0 rotate-45 bg-gold" />
            <span>
              <span className="block text-[0.7rem] font-medium uppercase tracking-[0.22em] text-foreground">
                {item.title}
              </span>
              {item.description && (
                <span className="mt-1.5 block text-sm leading-relaxed text-muted-foreground">{item.description}</span>
              )}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
