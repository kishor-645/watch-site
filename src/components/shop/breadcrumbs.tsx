import Link from "next/link";
import { cn } from "@/lib/utils";

export interface Crumb {
  label: string;
  href?: string;
}

export function Breadcrumbs({ items, className }: { items: Crumb[]; className?: string }) {
  return (
    <nav aria-label="Breadcrumb" className={className}>
      <ol className="type-small flex flex-wrap items-center gap-x-2 gap-y-1 text-muted-foreground">
        {items.map((item, i) => {
          const last = i === items.length - 1;
          return (
            <li key={`${item.label}-${i}`} className="flex min-w-0 items-center gap-2">
              {item.href && !last ? (
                <Link href={item.href} className="rounded-sm transition-colors duration-150 hover:text-brand-ink">
                  {item.label}
                </Link>
              ) : (
                <span
                  aria-current={last ? "page" : undefined}
                  className={cn(last && "max-w-[28ch] truncate font-medium text-foreground sm:max-w-none")}
                >
                  {item.label}
                </span>
              )}
              {!last && (
                <span aria-hidden className="text-foreground/25">
                  /
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
