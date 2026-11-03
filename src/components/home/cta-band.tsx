import Link from "next/link";
import { AccentTitle, container, ctaSecondary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

/**
 * Closing WhatsApp call-to-action: a rounded deep-ink panel with an aurora border and glow
 * (copy from Admin → Settings → Home). Hidden when both title and body are empty, unless
 * `showWhenEmpty` (then only the buttons show).
 */
export function CtaBand({
  title,
  body,
  whatsappHref,
  showWhenEmpty = false,
  withShopLink = false,
  className,
}: {
  title: string;
  body: string;
  whatsappHref: string;
  showWhenEmpty?: boolean;
  /** Adds a secondary "Explore the collection" button. */
  withShopLink?: boolean;
  className?: string;
}) {
  if (!title && !body && !showWhenEmpty) return null;
  return (
    <section
      aria-labelledby={title ? "cta-heading" : undefined}
      aria-label={title ? undefined : "Contact us"}
      className={cn("py-section", className)}
    >
      <div className={container}>
        <Reveal className="dark aurora-frame relative overflow-hidden rounded-[2rem] bg-background px-6 py-16 text-center text-foreground sm:px-12 sm:py-20 lg:py-24">
          <div aria-hidden className="orb orb-blue -left-24 -top-32 size-96" />
          <div aria-hidden className="orb orb-orange -bottom-40 -right-20 size-96" />
          <div aria-hidden className="bg-grid absolute inset-0" />
          <div className="relative">
            {title && (
              <h2 id="cta-heading" className="type-h2 mx-auto max-w-3xl text-balance">
                <AccentTitle text={title} />
              </h2>
            )}
            {body && <p className="type-lede mx-auto mt-5 max-w-[52ch] text-muted-foreground">{body}</p>}
            <div className={cn("flex flex-col justify-center gap-3 sm:flex-row", (title || body) && "mt-10")}>
              <WhatsAppLink href={whatsappHref}>Chat on WhatsApp</WhatsAppLink>
              {withShopLink && (
                <Link href="/shop" className={ctaSecondary}>
                  Explore the collection
                </Link>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
