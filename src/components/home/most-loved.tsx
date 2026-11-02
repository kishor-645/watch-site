"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading, container } from "@/components/home/section-heading";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";

const navButton =
  "inline-flex size-12 items-center justify-center rounded-full border border-foreground/20 text-foreground outline-none transition-all hover:border-gold hover:text-gold focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/50 disabled:pointer-events-none disabled:opacity-30";

export function MostLoved({ watches }: { watches: Watch[] }) {
  const scroller = useRef<HTMLUListElement>(null);
  const [canPrev, setCanPrev] = useState(false);
  const [canNext, setCanNext] = useState(true);

  const update = useCallback(() => {
    const el = scroller.current;
    if (!el) return;
    setCanPrev(el.scrollLeft > 4);
    setCanNext(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  useEffect(() => {
    const el = scroller.current;
    if (!el) return;
    update();
    el.addEventListener("scroll", update, { passive: true });
    window.addEventListener("resize", update);
    return () => {
      el.removeEventListener("scroll", update);
      window.removeEventListener("resize", update);
    };
  }, [update]);

  const scrollBy = (dir: 1 | -1) => {
    const el = scroller.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.scrollBy({ left: dir * el.clientWidth * 0.85, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <section aria-labelledby="most-loved-heading" className="overflow-hidden bg-charcoal/40 py-24 lg:py-32">
      <div className={container}>
        <div className="flex items-end justify-between gap-6">
          <Reveal>
            <SectionHeading
              id="most-loved-heading"
              eyebrow="Bestsellers"
              title={
                <>
                  Most <span className="italic text-gold-gradient">Loved</span> Watches
                </>
              }
              description="The pieces our collectors return to again and again."
            />
          </Reveal>
          <div className="hidden shrink-0 gap-3 md:flex">
            <button type="button" onClick={() => scrollBy(-1)} disabled={!canPrev} aria-label="Previous watches" aria-controls="most-loved-list" className={navButton}>
              <ChevronLeft className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
            <button type="button" onClick={() => scrollBy(1)} disabled={!canNext} aria-label="Next watches" aria-controls="most-loved-list" className={navButton}>
              <ChevronRight className="size-5" strokeWidth={1.5} aria-hidden />
            </button>
          </div>
        </div>
      </div>

      <div className={cn(container, "mt-14")}>
        <ul
          id="most-loved-list"
          ref={scroller}
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory gap-4 overflow-x-auto scroll-px-5 px-5 pb-2 sm:-mx-8 sm:scroll-px-8 sm:px-8 lg:mx-0 lg:gap-6 lg:scroll-px-0 lg:px-0"
        >
          {watches.map((watch) => (
            <li
              key={watch.id}
              className="w-[72%] shrink-0 snap-start sm:w-[44%] md:w-[38%] lg:w-[calc((100%-4.5rem)/4)]"
            >
              <ProductCard
                watch={watch}
                sizes="(min-width: 1024px) 22vw, (min-width: 640px) 44vw, 72vw"
              />
            </li>
          ))}
        </ul>
      </div>

      <div className={cn(container, "mt-12 flex justify-center")}>
        <Link
          href="/shop"
          className="text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground/80 underline decoration-gold/50 underline-offset-8 outline-none transition-colors hover:text-gold focus-visible:text-gold"
        >
          Shop all bestsellers
        </Link>
      </div>
    </section>
  );
}
