import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading, container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import type { CatalogOption } from "@/lib/types";
import { cn } from "@/lib/utils";

/**
 * Bento grid of category tiles: large rounded images with a gradient veil and the label set
 * inside. With an odd count the first tile is the hero tile (2×2 on desktop, full row on mobile),
 * so rows always fill.
 */
export function ShopByCategory({ categories }: { categories: CatalogOption[] }) {
  if (!categories.length) return null;
  const n = categories.length;
  const featureFirst = n % 2 === 1 && n > 1;
  const lgCols = n === 1 ? "lg:grid-cols-1" : n === 2 || n === 4 ? "lg:grid-cols-2" : n === 3 || n === 6 ? "lg:grid-cols-3" : "lg:grid-cols-4";

  return (
    <section aria-labelledby="categories-heading" className="py-section">
      <div className={container}>
        <Reveal>
          <SectionHeading id="categories-heading" eyebrow="Categories" title="Shop by category" />
        </Reveal>

        <Stagger
          as="ul"
          className={cn("mt-12 grid auto-rows-[minmax(13rem,auto)] grid-cols-2 gap-3 sm:gap-5 lg:mt-16 lg:auto-rows-[17rem] lg:gap-6", lgCols)}
        >
          {categories.map((c, i) => {
            const big = featureFirst && i === 0;
            return (
              <li key={c.slug} className={cn(big && "col-span-2 lg:row-span-2", !big && n === 1 && "col-span-2")}>
                <Link
                  href={`/shop?category=${encodeURIComponent(c.slug)}`}
                  data-cursor="view"
                  className="group relative flex h-full min-h-52 flex-col justify-end overflow-hidden rounded-[1.5rem] border border-foreground/[0.07] bg-surface-2 p-4 sm:p-6"
                >
                  {c.imageUrl && (
                    <Image
                      src={c.imageUrl}
                      alt=""
                      fill
                      sizes={big ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-700 ease-quiet motion-safe:group-hover:scale-[1.06]"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-[#05070f]/90 via-[#05070f]/30 to-transparent" />
                  <span
                    aria-hidden
                    className="absolute right-3 top-3 grid size-10 place-items-center rounded-full border border-white/15 bg-black/30 text-white backdrop-blur-md transition-[transform,background-color,color] duration-300 ease-snap group-hover:rotate-45 group-hover:bg-primary group-hover:text-primary-foreground sm:right-4 sm:top-4"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                  <span className="relative block">
                    <span
                      className={cn(
                        "block font-display font-bold leading-none tracking-[-0.03em] text-cream",
                        big ? "text-[clamp(2rem,1.4rem+2.6vw,3.75rem)]" : "text-[clamp(1.375rem,1.15rem+0.9vw,2rem)]",
                      )}
                    >
                      {c.label}
                    </span>
                    {c.description && (
                      <span
                        className={cn(
                          "mt-2 line-clamp-2 block max-w-[38ch] text-[0.8125rem] leading-snug text-cream/75",
                          !big && "max-sm:hidden",
                        )}
                      >
                        {c.description}
                      </span>
                    )}
                  </span>
                </Link>
              </li>
            );
          })}
        </Stagger>
      </div>
    </section>
  );
}
