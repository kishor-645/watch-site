import Image from "next/image";
import Link from "next/link";
import { ArrowUpRight, Check } from "lucide-react";
import { AccentTitle, container, ctaSecondary } from "@/components/home/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  /**
   * `lifestyle`: an admin-chosen hero photograph. `product`: the featured watch's first photo.
   * Both fill the rounded frame.
   */
  image: { url: string; alt: string; kind: "lifestyle" | "product" } | null;
  /** Watch featured in the hero ("Check availability" + floating info chip); null for an empty catalogue. */
  watch: { name: string; brand: string; href: string; price: string } | null;
  enquiryHref: string;
  /** Short reassurance points (trust item titles from settings), shown under the buttons. */
  highlights?: string[];
}

/**
 * Editorial asymmetric hero: a huge display headline (last word as the aurora serif accent) beside
 * the hero watch in a rounded frame with an aurora glow and a floating info chip. The animated
 * background (orbs + grid) is CSS-only and static for reduced motion.
 */
export function Hero({ eyebrow, title, subtitle, image, watch, enquiryHref, highlights = [] }: HeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="orb orb-blue -left-40 -top-40 -z-10 size-[34rem]" />
      <div aria-hidden className="orb orb-violet -z-10 right-[-10rem] top-[20%] size-[30rem]" />
      <div aria-hidden className="orb orb-orange -z-10 bottom-[-14rem] left-[30%] size-[28rem]" />

      <div
        className={cn(
          container,
          "grid gap-14 pb-16 pt-10 sm:pt-14 lg:min-h-[min(calc(100svh-76px),900px)] lg:grid-cols-12 lg:items-center lg:gap-8 lg:py-16",
        )}
      >
        <div className={cn("relative", image ? "lg:col-span-7" : "lg:col-span-10")}>
          {eyebrow && (
            <p className="eyebrow inline-flex items-center gap-2.5 rounded-full border border-foreground/10 bg-card/60 py-1.5 pl-2.5 pr-3.5 text-foreground/85 backdrop-blur-sm">
              <span aria-hidden className="dot-ping size-2 rounded-full bg-success text-success" />
              {eyebrow}
            </p>
          )}
          <h1
            id="hero-heading"
            className="type-display mt-6 max-w-[11ch] text-balance text-foreground lg:text-[clamp(4.5rem,1rem+5.6vw,7.25rem)]"
          >
            <AccentTitle text={title} />
          </h1>
          {subtitle && <p className="type-lede mt-7 max-w-[48ch] text-muted-foreground">{subtitle}</p>}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppLink href={enquiryHref}>{watch ? "Check availability" : "Chat on WhatsApp"}</WhatsAppLink>
            <Link href="/shop" className={ctaSecondary}>
              Explore the collection
              <ArrowUpRight
                aria-hidden
                className="size-4 transition-transform duration-300 ease-quiet group-hover/cta:-translate-y-0.5 group-hover/cta:translate-x-0.5"
              />
            </Link>
          </div>

          {highlights.length > 0 && (
            <ul className="mt-10 flex flex-wrap gap-x-6 gap-y-3" aria-label="Why buy from us">
              {highlights.slice(0, 3).map((h) => (
                <li key={h} className="flex items-center gap-2 text-sm text-foreground/80">
                  <span aria-hidden className="grid size-5 place-items-center rounded-full bg-brand/20 text-brand-ink">
                    <Check className="size-3" strokeWidth={3} />
                  </span>
                  {h}
                </li>
              ))}
            </ul>
          )}
        </div>

        {image && (
          <div className="relative mx-auto w-full max-w-[30rem] lg:col-span-5 lg:max-w-none">
            {/* Aurora glow + slowly turning bezel ring behind the frame. */}
            <div aria-hidden className="aurora-glow absolute -inset-16 opacity-35" />
            <svg
              aria-hidden
              viewBox="0 0 200 200"
              className="spin-slow pointer-events-none absolute -right-16 -top-16 size-48 text-foreground/25 sm:size-56"
            >
              <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeWidth="0.6" strokeDasharray="1 5" />
              <circle cx="100" cy="100" r="80" fill="none" stroke="currentColor" strokeWidth="0.4" />
            </svg>

            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] border border-foreground/10 bg-surface-2 shadow-[var(--shadow-lift)]">
              <Image
                src={image.url}
                alt={image.alt}
                fill
                priority
                sizes="(min-width: 1320px) 500px, (min-width: 1024px) 38vw, (min-width: 640px) 480px, 100vw"
                className="object-cover"
              />
              <div aria-hidden className="absolute inset-x-0 bottom-0 h-1/2 bg-gradient-to-t from-background/70 to-transparent" />
            </div>

            {watch && (
              <div className="float-slow absolute -bottom-6 left-3 right-3 sm:-left-8 sm:right-auto sm:max-w-[19rem]">
                <Link
                  href={watch.href}
                  className="group/chip flex items-center gap-4 rounded-2xl border border-foreground/10 bg-card p-4 pr-3 shadow-[var(--shadow-lift)] transition-colors duration-300 hover:border-brand-ink/50"
                >
                  <span className="min-w-0 flex-1">
                    <span className="eyebrow block text-brand-ink">{watch.brand}</span>
                    <span className="mt-1 block truncate font-display text-[0.9375rem] font-semibold text-foreground">
                      {watch.name}
                    </span>
                    <span className="type-price-md mt-0.5 block text-muted-foreground">{watch.price}</span>
                  </span>
                  <span
                    aria-hidden
                    className="grid size-10 shrink-0 place-items-center rounded-full bg-foreground text-background transition-transform duration-300 ease-snap group-hover/chip:rotate-45"
                  >
                    <ArrowUpRight className="size-4" />
                  </span>
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}
