import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { collections } from "@/data/collections";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading, container } from "@/components/home/section-heading";
import type { WatchCategory } from "@/lib/types";
import { cn } from "@/lib/utils";

const FEATURED: WatchCategory[] = ["chronograph", "diver", "skeleton", "everyday"];

export function FeaturedCollections() {
  const items = FEATURED.map((slug) => collections.find((c) => c.slug === slug)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c),
  );

  return (
    <section aria-labelledby="collections-heading" className="py-24 lg:py-32">
      <div className={container}>
        <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
          <Reveal>
            <SectionHeading
              id="collections-heading"
              eyebrow="Featured Collections"
              title={
                <>
                  Four ways to <span className="italic text-gold-gradient">keep time</span>
                </>
              }
            />
          </Reveal>
          <Reveal delay={0.1}>
            <Link
              href="/shop"
              className="group inline-flex items-center gap-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground/80 outline-none transition-colors hover:text-gold focus-visible:text-gold"
            >
              View all watches
              <ArrowUpRight className="size-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" aria-hidden />
            </Link>
          </Reveal>
        </div>

        <ul className="mt-14 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4 lg:gap-5">
          {items.map((c, i) => (
            <li key={c.slug}>
              <Reveal delay={i * 0.08} className="h-full">
                <Link
                  href={`/shop?category=${c.slug}`}
                  className="group relative block aspect-[4/5] overflow-hidden rounded-sm border border-border outline-none transition-colors hover:border-gold/40 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/50 lg:aspect-[3/4.4]"
                >
                  <Image
                    src={c.image}
                    alt=""
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
                    className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                  />
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/30 to-black/10 transition-opacity duration-500 group-hover:opacity-90" />
                  <span className="absolute inset-x-0 bottom-0 flex flex-col p-6 lg:p-7">
                    <span className="text-[0.6rem] uppercase tracking-[0.3em] text-gold">
                      {String(i + 1).padStart(2, "0")} — Collection
                    </span>
                    <span className="mt-3 font-serif text-3xl leading-tight text-foreground">{c.title}</span>
                    <span
                      className={cn(
                        "mt-2 line-clamp-2 text-sm leading-relaxed text-foreground/70",
                        "lg:max-h-0 lg:opacity-0 lg:transition-all lg:duration-500 lg:group-hover:max-h-16 lg:group-hover:opacity-100 lg:group-focus-visible:max-h-16 lg:group-focus-visible:opacity-100",
                      )}
                    >
                      {c.description}
                    </span>
                    <span className="mt-5 inline-flex items-center gap-2 text-[0.65rem] font-medium uppercase tracking-[0.28em] text-foreground">
                      Explore
                      <span aria-hidden className="h-px w-6 bg-gold transition-all duration-500 group-hover:w-12" />
                    </span>
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
