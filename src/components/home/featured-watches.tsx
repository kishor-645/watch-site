import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { SectionHeading, container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { ProductCard } from "@/components/product/product-card";
import type { CurrencyOptions } from "@/lib/format";
import type { Watch } from "@/lib/types";

export function FeaturedWatches({
  title,
  subtitle,
  watches,
  currency,
}: {
  title: string;
  subtitle: string;
  watches: Watch[];
  currency: CurrencyOptions;
}) {
  if (!watches.length) return null;
  return (
    <section aria-labelledby="featured-heading" className="py-20 lg:py-28">
      <div className={container}>
        <Reveal className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading id="featured-heading" title={title || "Featured watches"} description={subtitle || undefined} />
          <Link
            href="/shop"
            className="group inline-flex shrink-0 items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.26em] text-foreground/80 transition-colors hover:text-gold"
          >
            View all watches
            <ArrowRight className="size-4 transition-transform group-hover:translate-x-0.5" aria-hidden />
          </Link>
        </Reveal>

        <ul className="mt-12 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {watches.map((watch) => (
            <Reveal as="li" key={watch.id}>
              <ProductCard watch={watch} currency={currency} sizes="(min-width: 1280px) 290px, (min-width: 1024px) 23vw, 50vw" />
            </Reveal>
          ))}
        </ul>
      </div>
    </section>
  );
}
