import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { SectionHeading, container, ctaSecondary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { Stagger } from "@/components/motion/stagger";
import { ProductCard } from "@/components/product/product-card";
import type { CurrencyOptions } from "@/lib/format";
import type { Watch } from "@/lib/types";

export function FeaturedWatches({
  title,
  subtitle,
  watches,
  currency,
  enquiryUrls,
  viewAllHref = "/shop",
}: {
  title: string;
  subtitle: string;
  watches: Watch[];
  currency: CurrencyOptions;
  /** Server-built WhatsApp enquiry link per watch slug. */
  enquiryUrls: Record<string, string>;
  viewAllHref?: string;
}) {
  if (!watches.length) return null;
  return (
    <section aria-labelledby="featured-heading" className="py-section">
      <div className={container}>
        <Reveal className="flex flex-col gap-8 sm:flex-row sm:items-end sm:justify-between">
          <SectionHeading
            id="featured-heading"
            eyebrow={`${String(watches.length).padStart(2, "0")} ${watches.length === 1 ? "piece" : "pieces"}`}
            title={title || "Featured watches"}
            description={subtitle || undefined}
          />
          <Link href={viewAllHref} className={`${ctaSecondary} shrink-0 self-start sm:self-auto`}>
            View all watches
            <ArrowUpRight
              aria-hidden
              className="size-4 transition-transform duration-300 ease-quiet group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
            />
          </Link>
        </Reveal>

        <Stagger
          as="ul"
          className="mt-12 grid grid-cols-2 gap-3 sm:gap-5 md:grid-cols-3 lg:mt-16 lg:grid-cols-4 lg:gap-6"
        >
          {watches.map((watch) => (
            <li key={watch.id}>
              <ProductCard
                watch={watch}
                currency={currency}
                enquiryUrl={enquiryUrls[watch.slug] ?? ""}
                sizes="(min-width: 1320px) 290px, (min-width: 1024px) 23vw, (min-width: 768px) 31vw, 50vw"
              />
            </li>
          ))}
        </Stagger>
      </div>
    </section>
  );
}
