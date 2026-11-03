import Image from "next/image";
import Link from "next/link";
import { SectionHeading, container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import type { CatalogOption } from "@/lib/types";
import { cn } from "@/lib/utils";

// Up to 4 per row; 5 and 6 tiles form full rows instead of leaving a lone tile on the last row.
const LG_COLS: Record<number, { cols: string; sizes: string }> = {
  1: { cols: "lg:grid-cols-1", sizes: "(min-width: 768px) 31vw, 50vw" },
  2: { cols: "lg:grid-cols-2", sizes: "(min-width: 1320px) 610px, (min-width: 1024px) 46vw, (min-width: 768px) 31vw, 50vw" },
  3: { cols: "lg:grid-cols-3", sizes: "(min-width: 1320px) 400px, (min-width: 768px) 31vw, 50vw" },
  5: { cols: "lg:grid-cols-5", sizes: "(min-width: 1320px) 230px, (min-width: 1024px) 18vw, (min-width: 768px) 31vw, 50vw" },
  6: { cols: "lg:grid-cols-3", sizes: "(min-width: 1320px) 400px, (min-width: 768px) 31vw, 50vw" },
};
const LG_DEFAULT = {
  cols: "lg:grid-cols-4",
  sizes: "(min-width: 1320px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 50vw",
};

export function ShopByCategory({ categories }: { categories: CatalogOption[] }) {
  if (!categories.length) return null;
  const { cols: lgCols, sizes } = LG_COLS[categories.length] ?? LG_DEFAULT;

  return (
    <section aria-labelledby="categories-heading" className="border-t border-border py-section">
      <div className={container}>
        <Reveal>
          <SectionHeading id="categories-heading" title="Shop by category" />
        </Reveal>

        <Reveal
          as="ul"
          className={cn("mt-10 grid grid-cols-2 gap-x-4 gap-y-8 md:grid-cols-3 lg:mt-14 lg:gap-x-6 lg:gap-y-10", lgCols)}
        >
          {categories.map((c) => (
            <li key={c.slug}>
              <Link href={`/shop?category=${encodeURIComponent(c.slug)}`} className="group block rounded-sm">
                <span className="relative block aspect-[4/5] overflow-hidden bg-surface-2">
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      sizes={sizes}
                      className="object-cover transition-transform duration-600 ease-quiet motion-safe:group-hover:scale-[1.03]"
                    />
                  )}
                </span>
                <span className="type-h3 mt-4 block text-foreground decoration-1 underline-offset-4 group-hover:underline">
                  {c.label}
                </span>
                {c.description && (
                  <span className="type-small mt-1 line-clamp-2 block text-muted-foreground">{c.description}</span>
                )}
              </Link>
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
