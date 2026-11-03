import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { container, ctaSecondary } from "@/components/home/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

interface HeroProps {
  eyebrow: string;
  title: string;
  subtitle: string;
  image: { url: string; alt: string } | null;
  /** Watch featured in the hero (chip + "Check availability"); null for an empty catalogue. */
  watch: { name: string; href: string; price: string } | null;
  enquiryHref: string;
}

export function Hero({ eyebrow, title, subtitle, image, watch, enquiryHref }: HeroProps) {
  return (
    <section
      aria-labelledby="hero-heading"
      className={cn(
        "relative flex overflow-hidden border-b border-gold/10 bg-background",
        image ? "min-h-[78svh] items-end lg:min-h-[86svh] lg:items-center" : "items-center py-24 lg:py-32",
      )}
    >
      {image && (
        <>
          <Image
            src={image.url}
            alt={image.alt}
            fill
            priority
            sizes="100vw"
            className="object-cover object-center lg:object-[70%_center]"
          />
          {/* Legibility veils (kept light so the photograph stays the hero). */}
          <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-background via-background/60 to-background/10 lg:hidden" />
          <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-background/95 via-background/60 to-transparent lg:block" />
        </>
      )}

      <div className={cn(container, "relative z-10 pb-14 pt-28 lg:py-24")}>
        <div className="fade-in max-w-2xl">
          {eyebrow && (
            <p className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.35em] text-gold">
              <span aria-hidden className="h-px w-10 bg-gold/70" />
              {eyebrow}
            </p>
          )}
          <h1
            id="hero-heading"
            className="mt-5 text-[2.6rem] font-medium leading-[1.02] text-foreground sm:text-6xl lg:text-7xl"
          >
            {title}
          </h1>
          {subtitle && (
            <p className="mt-6 max-w-lg text-base leading-relaxed text-foreground/80 sm:text-lg">{subtitle}</p>
          )}

          <div className="mt-9 flex flex-col gap-3 sm:flex-row sm:gap-4">
            <Link href="/shop" className={ctaSecondary}>
              Explore the collection
              <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
            </Link>
            <WhatsAppLink href={enquiryHref}>{watch ? "Check availability" : "Chat on WhatsApp"}</WhatsAppLink>
          </div>

          {watch && (
            <Link
              href={watch.href}
              className="mt-10 inline-flex items-center gap-5 border border-gold/25 bg-background/60 px-5 py-3.5 backdrop-blur-md transition-colors hover:border-gold/60"
            >
              <span>
                <span className="block text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">Featured</span>
                <span className="mt-1 block font-serif text-lg text-foreground">{watch.name}</span>
              </span>
              <span aria-hidden className="h-9 w-px bg-gold/30" />
              <span className="font-serif text-lg font-semibold text-gold">{watch.price}</span>
            </Link>
          )}
        </div>
      </div>
    </section>
  );
}
