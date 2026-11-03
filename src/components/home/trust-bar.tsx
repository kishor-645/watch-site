import { container } from "@/components/home/section-heading";
import type { SiteSettings } from "@/lib/types";
import { cn } from "@/lib/utils";

/** Trust points from Admin → Settings → Home, as a calm text row. Renders nothing when none are configured. */
export function TrustBar({ items }: { items: SiteSettings["home"]["trustItems"] }) {
  if (!items.length) return null;
  return (
    <section aria-label="Why buy from us" className="py-section">
      <ul
        className={cn(
          container,
          "grid grid-cols-2 gap-x-6 gap-y-10 lg:gap-x-8",
          items.length >= 4 ? "lg:grid-cols-4" : items.length === 3 ? "lg:grid-cols-3" : "",
        )}
      >
        {items.map((item) => (
          <li key={item.title}>
            <div className="border-t border-border pt-6">
              <p className="text-sm font-medium text-foreground">{item.title}</p>
              {item.description && <p className="type-small mt-1.5 text-muted-foreground">{item.description}</p>}
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}

/** Up to three trust titles as a compact list (product page, under the enquiry button). */
export function TrustList({ items, className }: { items: SiteSettings["home"]["trustItems"]; className?: string }) {
  const shown = items.slice(0, 3);
  if (!shown.length) return null;
  return (
    <ul aria-label="Why buy from us" className={cn("flex flex-col gap-2", className)}>
      {shown.map((item) => (
        <li key={item.title} className="flex items-center gap-3 text-sm text-foreground">
          <span aria-hidden className="size-1 shrink-0 rounded-full bg-foreground" />
          {item.title}
        </li>
      ))}
    </ul>
  );
}
