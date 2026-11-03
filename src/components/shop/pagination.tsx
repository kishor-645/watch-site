import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { serializeCatalogQuery } from "@/lib/schemas/catalog-query";
import type { CatalogQuery } from "@/lib/types";
import { cn } from "@/lib/utils";

/** 1 … 4 5 [6] 7 8 … 20 */
function pageList(current: number, count: number): (number | "gap")[] {
  const pages = new Set([1, count, current - 1, current, current + 1].filter((p) => p >= 1 && p <= count));
  const sorted = [...pages].sort((a, b) => a - b);
  const out: (number | "gap")[] = [];
  sorted.forEach((p, i) => {
    if (i > 0 && p - sorted[i - 1] > 1) out.push(p - sorted[i - 1] === 2 ? p - 1 : "gap");
    out.push(p);
  });
  return out;
}

const item =
  "inline-flex h-11 min-w-11 items-center justify-center gap-1.5 rounded-full px-3 text-sm font-medium tabular-nums transition-colors duration-150";
const step = cn(item, "border border-foreground/[0.1] text-foreground/80 hover:border-foreground/40 hover:text-foreground");
const stepDisabled = cn(item, "text-muted-foreground opacity-40");

/** Server-rendered page links that preserve every active filter. */
export function Pagination({ query, page, pageCount }: { query: CatalogQuery; page: number; pageCount: number }) {
  if (pageCount <= 1) return null;
  const href = (p: number) => {
    const qs = serializeCatalogQuery({ ...query, page: p });
    return qs ? `/shop?${qs}` : "/shop";
  };

  return (
    <nav aria-label="Pagination" className="mt-16 flex justify-center">
      <ul className="flex flex-wrap items-center justify-center gap-1 sm:gap-2">
        <li>
          {page > 1 ? (
            <Link href={href(page - 1)} rel="prev" className={step}>
              <ChevronLeft aria-hidden className="size-4" />
              <span className="sr-only sm:not-sr-only">Previous</span>
              <span className="sr-only"> page</span>
            </Link>
          ) : (
            <span aria-hidden className={stepDisabled}>
              <ChevronLeft className="size-4" />
              <span className="hidden sm:inline">Previous</span>
            </span>
          )}
        </li>
        {pageList(page, pageCount).map((p, i) =>
          p === "gap" ? (
            <li key={`gap-${i}`} aria-hidden className="px-1 text-muted-foreground">
              …
            </li>
          ) : (
            <li key={p}>
              <Link
                href={href(p)}
                aria-current={p === page ? "page" : undefined}
                aria-label={`Page ${p}`}
                className={cn(
                  item,
                  p === page
                    ? "bg-foreground font-semibold text-background"
                    : "text-muted-foreground hover:bg-foreground/[0.08] hover:text-foreground",
                )}
              >
                {p}
              </Link>
            </li>
          ),
        )}
        <li>
          {page < pageCount ? (
            <Link href={href(page + 1)} rel="next" className={step}>
              <span className="sr-only sm:not-sr-only">Next</span>
              <span className="sr-only"> page</span>
              <ChevronRight aria-hidden className="size-4" />
            </Link>
          ) : (
            <span aria-hidden className={stepDisabled}>
              <span className="hidden sm:inline">Next</span>
              <ChevronRight className="size-4" />
            </span>
          )}
        </li>
      </ul>
    </nav>
  );
}
