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
  /**
   * `lifestyle`: an admin-chosen hero photograph (cropped to fill the frame).
   * `product`: the featured watch's first photo (blended into the stone backdrop).
   */
  image: { url: string; alt: string; kind: "lifestyle" | "product" } | null;
  /** Watch featured in the hero ("Check availability" + featured line); null for an empty catalogue. */
  watch: { name: string; href: string; price: string } | null;
  enquiryHref: string;
}

/** Split hero: text on ivory beside a 4:5 image on stone. No veils, no text over the photograph. */
export function Hero({ eyebrow, title, subtitle, image, watch, enquiryHref }: HeroProps) {
  return (
    <section aria-labelledby="hero-heading" className="border-b border-border">
      <div
        className={cn(
          "mx-auto grid w-full max-w-[82.5rem] lg:min-h-[min(88svh,860px)] lg:grid-cols-2 lg:items-center lg:gap-16 lg:px-12",
          !image && "lg:grid-cols-1",
        )}
      >
        {image && (
          <div className="relative aspect-[4/5] w-full overflow-hidden bg-surface-2 sm:aspect-[5/4] lg:order-2 lg:my-12 lg:aspect-[4/5]">
            <Image
              src={image.url}
              alt={image.alt}
              fill
              priority
              sizes="(min-width: 1320px) 600px, (min-width: 1024px) 46vw, 100vw"
              // The catalogue's product photos are full-frame shots, so both kinds fill the frame;
              // product shots are blended so white studio backgrounds take on the stone tone.
              className={cn("object-cover", image.kind === "product" && "mix-blend-multiply")}
            />
          </div>
        )}

        <div className={cn(container, "fade-in py-12 sm:py-16 lg:max-w-none lg:px-0 lg:py-20", !image && "lg:py-32")}>
          {eyebrow && <p className="eyebrow text-muted-foreground">{eyebrow}</p>}
          <h1 id="hero-heading" className="type-display mt-5 max-w-[14ch] text-balance text-foreground">
            {title}
          </h1>
          {subtitle && <p className="type-lede mt-6 max-w-[52ch] text-muted-foreground">{subtitle}</p>}

          <div className="mt-10 flex flex-col gap-3 sm:flex-row sm:flex-wrap">
            <WhatsAppLink href={enquiryHref}>{watch ? "Check availability" : "Chat on WhatsApp"}</WhatsAppLink>
            <Link href="/shop" className={ctaSecondary}>
              Explore the collection
            </Link>
          </div>

          {watch && (
            <p className="mt-10 border-t border-border pt-6">
              <span className="type-small block text-muted-foreground">Featured</span>
              <Link
                href={watch.href}
                className="group/featured mt-1 inline-flex flex-wrap items-baseline gap-x-3 gap-y-1 rounded-sm"
              >
                <span className="font-serif text-xl text-foreground underline decoration-border decoration-1 underline-offset-[6px] transition-colors duration-150 group-hover/featured:decoration-foreground">
                  {watch.name}
                </span>
                <span aria-hidden className="text-muted-foreground">
                  ·
                </span>
                <span className="type-price-md text-foreground">{watch.price}</span>
                <ArrowRight
                  aria-hidden
                  className="size-4 self-center text-muted-foreground transition-transform duration-150 group-hover/featured:translate-x-0.5"
                />
              </Link>
            </p>
          )}
        </div>
      </div>
    </section>
  );
}
