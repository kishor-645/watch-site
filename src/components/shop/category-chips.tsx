import Link from "next/link";
import { cn } from "@/lib/utils";

/**
 * Horizontally scrollable category chips under the shop title. Plain links to `/shop?category=…`
 * (category browsing starts a fresh view); the active one is the single category being browsed.
 */
export function CategoryChips({
  categories,
  active,
}: {
  categories: { slug: string; label: string }[];
  /** Slug of the single selected category, `null` for all watches, `undefined` for a mixed filter. */
  active: string | null | undefined;
}) {
  if (!categories.length) return null;
  const chip = (isActive: boolean) =>
    cn(
      "inline-flex h-10 items-center whitespace-nowrap rounded-full border px-4 text-sm font-medium transition-[background-color,border-color,color] duration-300 ease-quiet",
      isActive
        ? "border-foreground bg-foreground text-background"
        : "border-foreground/[0.1] bg-card/60 text-foreground/80 hover:border-brand-ink hover:text-foreground",
    );

  return (
    <nav aria-label="Categories" className="-mx-5 mt-8 sm:-mx-8 lg:mx-0">
      <ul className="no-scrollbar flex gap-2 overflow-x-auto px-5 pb-1 sm:px-8 lg:flex-wrap lg:px-0">
        <li>
          <Link href="/shop" aria-current={active === null ? "page" : undefined} className={chip(active === null)}>
            All watches
          </Link>
        </li>
        {categories.map((c) => {
          const isActive = active === c.slug;
          return (
            <li key={c.slug}>
              <Link
                href={`/shop?category=${encodeURIComponent(c.slug)}`}
                aria-current={isActive ? "page" : undefined}
                className={chip(isActive)}
              >
                {c.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
