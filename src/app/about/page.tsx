import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { ArrowRight, Gem, ShieldCheck, Sparkles, Wrench } from "lucide-react";
import { getFlagship } from "@/lib/catalog";
import { watches } from "@/data/watches";
import { collections } from "@/data/collections";
import { PageHero } from "@/components/home/page-hero";
import { BRAND_STATS } from "@/components/home/brand-story";
import { SectionHeading, container, ctaPrimary, ctaSecondary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { cn } from "@/lib/utils";

export const metadata: Metadata = {
  title: "About Us",
  description:
    "The MyWatch story: a Mumbai atelier curating authentic luxury watches, hand-inspected by horologists and delivered with a 2-year warranty.",
  alternates: { canonical: "/about" },
};

const VALUES = [
  {
    Icon: ShieldCheck,
    title: "Uncompromising authenticity",
    text: "Every watch is sourced directly or through authorised partners and arrives with full papers and our certificate of authenticity.",
  },
  {
    Icon: Wrench,
    title: "Inspected by hand",
    text: "Our horologists run a 120-point inspection, regulating movements and checking water resistance before anything leaves the atelier.",
  },
  {
    Icon: Gem,
    title: "Curated, never crowded",
    text: "We carry a deliberately small collection, choosing each reference for its design, finishing and the story it tells.",
  },
  {
    Icon: Sparkles,
    title: "Service for a lifetime",
    text: "A 2-year warranty, complimentary first service and a concierge who knows your watch by name.",
  },
];

const MILESTONES = [
  { year: "2008", text: "A single workbench opens in Kala Ghoda, Mumbai." },
  { year: "2014", text: "Our first in-house curated collection of mechanical watches." },
  { year: "2020", text: "MyWatch goes online, with insured delivery across India." },
  { year: "2026", text: "The Aurora Chronograph debuts as our flagship." },
];

export default function AboutPage() {
  const flagship = getFlagship();
  const heroImage = collections.find((c) => c.slug === "skeleton")?.image ?? flagship.images[0];
  const sideImage = watches.find((w) => w.category === "dress")?.images[0] ?? flagship.images[1] ?? flagship.images[0];

  return (
    <>
      <PageHero
        eyebrow="About MyWatch"
        title={
          <>
            Crafted with <span className="italic text-gold-gradient">patience</span>
          </>
        }
        description="For nearly two decades we have believed that a fine watch deserves to be chosen as carefully as it was made."
      />

      <section aria-label="Atelier" className={cn(container, "pt-16 lg:pt-24")}>
        <Reveal>
          <div className="relative aspect-[4/3] overflow-hidden rounded-sm border border-gold/15 sm:aspect-[21/9]">
            <Image src={heroImage} alt="Detail of a mechanical watch movement" fill priority sizes="(min-width: 1280px) 1200px, 100vw" className="object-cover" />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/70 via-transparent to-transparent" />
          </div>
        </Reveal>
      </section>

      <section aria-labelledby="story-heading" className={cn(container, "grid gap-12 py-24 lg:grid-cols-12 lg:gap-16 lg:py-32")}>
        <Reveal className="lg:col-span-5">
          <SectionHeading
            id="story-heading"
            eyebrow="Our Story"
            title={
              <>
                From one bench to <span className="italic text-gold-gradient">forty thousand</span> wrists
              </>
            }
          />
        </Reveal>
        <Reveal delay={0.1} className="space-y-6 text-base leading-relaxed text-muted-foreground sm:text-lg lg:col-span-7 lg:pt-12">
          <p>
            MyWatch started in 2008 as a small repair and restoration atelier in Mumbai. Collectors brought us
            their grandfathers&apos; watches; we sent them home running beautifully, and they kept coming back
            asking us to help them find the next one.
          </p>
          <p>
            That trust became our business. Today we curate a tightly edited collection of chronographs, divers,
            skeletons and dress watches, from storied maisons to our own MyWatch line, and the same hands that
            restored those heirlooms still inspect every piece we sell.
          </p>
          <p className="font-serif text-2xl italic leading-snug text-foreground sm:text-3xl">
            &ldquo;We do not sell watches we would not wear ourselves.&rdquo;
          </p>
        </Reveal>
      </section>

      <section aria-labelledby="values-heading" className="border-y border-gold/10 bg-charcoal/40 py-24 lg:py-32">
        <div className={container}>
          <Reveal>
            <SectionHeading id="values-heading" eyebrow="What we stand for" align="center" title="Four promises, kept" />
          </Reveal>
          <ul className="mt-16 grid gap-px overflow-hidden rounded-sm border border-border bg-border sm:grid-cols-2 lg:grid-cols-4">
            {VALUES.map(({ Icon, title, text }, i) => (
              <li key={title} className="bg-background">
                <Reveal delay={i * 0.08} className="flex h-full flex-col p-8 lg:p-10">
                  <span className="flex size-12 items-center justify-center rounded-full border border-gold/30 text-gold">
                    <Icon className="size-5" strokeWidth={1.25} aria-hidden />
                  </span>
                  <h3 className="mt-8 text-2xl font-medium">{title}</h3>
                  <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{text}</p>
                </Reveal>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <section aria-labelledby="journey-heading" className={cn(container, "grid items-center gap-14 py-24 lg:grid-cols-2 lg:gap-20 lg:py-32")}>
        <Reveal>
          <SectionHeading id="journey-heading" eyebrow="Our Journey" title="Milestones" />
          <ol className="mt-10 border-l border-gold/25">
            {MILESTONES.map((m) => (
              <li key={m.year} className="relative pb-8 pl-8 last:pb-0">
                <span aria-hidden className="absolute -left-[5px] top-2 size-2.5 rounded-full border border-gold bg-background" />
                <p className="font-serif text-2xl text-gold">{m.year}</p>
                <p className="mt-1 text-muted-foreground">{m.text}</p>
              </li>
            ))}
          </ol>
        </Reveal>
        <Reveal delay={0.1} className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-gold/15">
            <Image src={sideImage} alt="A dress watch from the MyWatch collection" fill sizes="(min-width: 1024px) 45vw, 100vw" className="object-cover" />
          </div>
          <span aria-hidden className="pointer-events-none absolute -bottom-4 -left-4 hidden h-full w-full border border-gold/25 lg:block" />
        </Reveal>
      </section>

      <section aria-label="MyWatch in numbers" className="border-y border-gold/10">
        <dl className={cn(container, "grid grid-cols-2 lg:grid-cols-4")}>
          {BRAND_STATS.map((s, i) => (
            <div
              key={s.label}
              className={cn(
                "flex flex-col-reverse items-center gap-2 py-12 text-center",
                i % 2 === 1 && "border-l border-border",
                i >= 2 && "border-t border-border lg:border-t-0",
                i === 2 && "lg:border-l",
              )}
            >
              <dt className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">{s.label}</dt>
              <dd className="font-serif text-5xl font-medium text-gold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section aria-labelledby="about-cta" className={cn(container, "pt-24 text-center lg:pt-32")}>
        <Reveal>
          <h2 id="about-cta" className="mx-auto max-w-3xl text-4xl font-medium leading-tight sm:text-5xl">
            Find a watch worth <span className="italic text-gold-gradient">passing on</span>
          </h2>
          <div className="mt-10 flex flex-col justify-center gap-3 sm:flex-row sm:gap-4">
            <Link href="/shop" className={ctaPrimary}>
              Explore the collection
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
            </Link>
            <Link href="/contact" className={ctaSecondary}>
              Visit the boutique
            </Link>
          </div>
        </Reveal>
      </section>
    </>
  );
}
