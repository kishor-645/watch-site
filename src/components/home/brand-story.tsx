import Image from "next/image";
import Link from "next/link";
import { Reveal } from "@/components/motion/reveal";
import { container } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";

export const BRAND_STATS = [
  { value: "18", label: "Years of curation" },
  { value: "40k+", label: "Collectors served" },
  { value: "120", label: "Point inspection" },
  { value: "100%", label: "Authenticity guaranteed" },
];

export function BrandStory({ image, secondaryImage }: { image: string; secondaryImage?: string }) {
  return (
    <section aria-labelledby="story-heading" className="relative overflow-hidden border-y border-gold/10 bg-charcoal/40 py-24 lg:py-32">
      <div className={cn(container, "grid items-center gap-14 lg:grid-cols-12 lg:gap-16")}>
        <Reveal className="relative lg:col-span-6">
          <div className="relative aspect-[5/6] overflow-hidden rounded-sm sm:aspect-[4/3] lg:aspect-[5/6]">
            <Image src={image} alt="A MyWatch timepiece on the watchmaker's bench" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-tr from-background/50 to-transparent" />
          </div>
          {secondaryImage && (
            <div className="absolute -bottom-10 -right-2 hidden aspect-square w-[38%] overflow-hidden rounded-sm border-4 border-background shadow-2xl sm:block lg:-right-10">
              <Image src={secondaryImage} alt="" fill sizes="(min-width: 1024px) 18vw, 35vw" className="object-cover" />
            </div>
          )}
        </Reveal>

        <Reveal delay={0.1} className="lg:col-span-6">
          <p className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold">
            <span aria-hidden className="h-px w-8 bg-gold/60" />
            Our Story
          </p>
          <h2 id="story-heading" className="mt-5 text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl">
            Time, kept <span className="italic text-gold-gradient">beautifully</span>
          </h2>
          <div className="mt-7 space-y-5 text-base leading-relaxed text-muted-foreground sm:text-lg">
            <p>
              MyWatch began at a single workbench in Mumbai with one belief: a fine watch should be bought
              with the same care with which it was made.
            </p>
            <p>
              Today our horologists still inspect every piece by hand, regulate every movement, and pack each
              watch as though it were our own. The result is a collection that is small by design and
              uncompromising in craft.
            </p>
          </div>

          <dl className="mt-12 grid grid-cols-2 gap-px overflow-hidden rounded-sm border border-border bg-border">
            {BRAND_STATS.map((s) => (
              <div key={s.label} className="flex flex-col-reverse gap-1 bg-background px-5 py-6">
                <dt className="text-[0.6rem] uppercase tracking-[0.28em] text-muted-foreground">{s.label}</dt>
                <dd className="font-serif text-4xl font-medium text-gold">{s.value}</dd>
              </div>
            ))}
          </dl>

          <Link
            href="/about"
            className="mt-10 inline-block text-[0.7rem] font-medium uppercase tracking-[0.28em] text-foreground underline decoration-gold/50 underline-offset-8 outline-none transition-colors hover:text-gold focus-visible:text-gold"
          >
            Read our story
          </Link>
        </Reveal>
      </div>
    </section>
  );
}
