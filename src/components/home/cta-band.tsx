import Link from "next/link";
import { container, ctaSecondary } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

/**
 * Full-width dark WhatsApp call-to-action band (copy from Admin → Settings → Home).
 * Hidden when both title and body are empty, unless `showWhenEmpty` (then only the buttons show).
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
      className={cn("dark bg-background py-section text-foreground", className)}
    >
      <Reveal className={cn(container, "text-center")}>
        {title && (
          <h2 id="cta-heading" className="type-h2 mx-auto max-w-2xl text-balance">
            {title}
          </h2>
        )}
        {body && <p className="type-lede mx-auto mt-4 max-w-[52ch] text-muted-foreground">{body}</p>}
        <div className={cn("flex flex-col justify-center gap-3 sm:flex-row", (title || body) && "mt-10")}>
          <WhatsAppLink href={whatsappHref}>Chat on WhatsApp</WhatsAppLink>
          {withShopLink && (
            <Link href="/shop" className={ctaSecondary}>
              Explore the collection
            </Link>
          )}
        </div>
      </Reveal>
    </section>
  );
}
