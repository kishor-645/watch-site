import { container } from "@/components/home/section-heading";
import { Reveal } from "@/components/motion/reveal";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

/** WhatsApp call-to-action band. Hidden when both title and body are empty. */
export function CtaBand({
  title,
  body,
  whatsappHref,
  className,
}: {
  title: string;
  body: string;
  whatsappHref: string;
  className?: string;
}) {
  if (!title && !body) return null;
  return (
    <section aria-labelledby={title ? "cta-heading" : undefined} aria-label={title ? undefined : "Contact us"} className={cn("pt-20 lg:pt-28", className)}>
      <div className={container}>
        <Reveal className="rounded-sm border border-gold/20 bg-charcoal px-6 py-14 text-center sm:px-12 lg:py-16">
          {title && (
            <h2 id="cta-heading" className="mx-auto max-w-2xl text-3xl font-medium leading-tight sm:text-4xl">
              {title}
            </h2>
          )}
          {body && <p className="mx-auto mt-4 max-w-lg text-muted-foreground">{body}</p>}
          <WhatsAppLink href={whatsappHref} className="mt-8">
            Chat on WhatsApp
          </WhatsAppLink>
        </Reveal>
      </div>
    </section>
  );
}
