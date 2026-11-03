import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading, container, textLink } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import type { CurrencyOptions } from "@/lib/format";
import type { Watch } from "@/lib/types";

export function FeaturedWatches({
  title,
  subtitle,
  watches,
  currency,
  viewAllHref = "/shop",
}: {
  title: string;
  subtitle: string;
  watches: Watch[];
  currency: CurrencyOptions;
  viewAllHref?: string;
}) {
  if (!watches.length) return null;
  return (
    <section aria-labelledby="featured-heading" className="py-section">
      <div className={container}>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="featured-heading" title={title || "Featured watches"} description={subtitle || undefined} />
          <Link href={viewAllHref} className={`${textLink} shrink-0 self-start sm:self-auto`}>
            View all watches
            <ArrowRight className="size-4 transition-transform duration-150 group-hover/link:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>

        <Reveal
          as="ul"
          className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 md:grid-cols-3 lg:mt-14 lg:grid-cols-4 lg:gap-x-8 lg:gap-y-14"
        >
          {watches.map((watch) => (
            <li key={watch.id}>
              <ProductCard
                watch={watch}
                currency={currency}
                sizes="(min-width: 1320px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 50vw"
              />
            </li>
          ))}
        </Reveal>
      </div>
    </section>
  );
}
