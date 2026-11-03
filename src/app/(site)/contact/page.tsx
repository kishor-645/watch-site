import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/home/page-hero";
import { container, textLink } from "@/components/home/section-heading";
import { WhatsAppIcon } from "@/components/site/icons";
import { SocialLinks } from "@/components/site/social-links";
import { externalLinkProps, telHref } from "@/components/site/text";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";
import { displayPhone, generalEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";

export async function generateMetadata(): Promise<Metadata> {
  const { general } = await getSiteSettings();
  return {
    title: "Contact",
    description: `Contact ${general.siteName} on WhatsApp for availability, pricing and advice.`,
    alternates: { canonical: "/contact" },
  };
}

const linkClass =
  "rounded-sm text-foreground underline decoration-foreground/30 underline-offset-[6px] transition-colors duration-150 hover:text-brand-ink hover:decoration-brand-ink";

/** One contact detail as a rounded card (dt/dd pair inside the parent <dl>). */
function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="card-glow flex gap-4 rounded-[1.375rem] border border-foreground/[0.07] bg-card p-5 sm:p-6">
      <span className="grid size-11 shrink-0 place-items-center rounded-full bg-brand/15 text-brand-ink">{icon}</span>
      <div className="min-w-0 pt-0.5">
        <dt className="eyebrow text-muted-foreground">{label}</dt>
        <dd className="mt-1.5 text-[0.9375rem] font-medium leading-relaxed text-foreground sm:text-base">{children}</dd>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { contact, general, social } = settings;
  const whatsappHref = generalEnquiryUrl(settings);
  const whatsappDisplay = displayPhone(contact.whatsappNumber);
  const iconClass = "size-[18px]";

  return (
    <>
      <PageHero eyebrow={general.siteName} title="Contact" description={general.tagline || undefined} />

      <div className={cn(container, "grid gap-6 pb-section lg:grid-cols-12 lg:gap-8")}>
        <section
          aria-labelledby="whatsapp-heading"
          className="dark aurora-frame relative flex flex-col items-start overflow-hidden rounded-[2rem] bg-background p-7 sm:p-10 lg:col-span-5 lg:self-start"
        >
          <div aria-hidden className="orb orb-orange -right-24 -top-24 size-72" />
          <div aria-hidden className="orb orb-blue -bottom-32 -left-24 size-72" />
          <span aria-hidden className="relative grid size-14 place-items-center rounded-2xl bg-primary text-primary-foreground">
            <WhatsAppIcon className="size-7" />
          </span>
          <h2 id="whatsapp-heading" className="type-h3 relative mt-8 text-foreground">
            Message us on WhatsApp
          </h2>
          {whatsappDisplay && (
            <p className="relative mt-3 font-display text-[clamp(1.5rem,1.2rem+1.2vw,2.25rem)] font-bold tabular-nums tracking-[-0.02em] text-foreground">
              {whatsappDisplay}
            </p>
          )}
          <WhatsAppLink href={whatsappHref} className="relative mt-8 w-full">
            Chat on WhatsApp
          </WhatsAppLink>
          {contact.businessHours && (
            <p className="type-small relative mt-4 text-muted-foreground">{contact.businessHours}</p>
          )}
        </section>

        <section aria-labelledby="details-heading" className="lg:col-span-7">
          <h2 id="details-heading" className="type-h3 text-foreground">
            {general.siteName}
          </h2>
          <dl className="mt-6 grid gap-3 sm:grid-cols-2 sm:gap-4">
            {contact.phone && (
              <Row icon={<Phone className={iconClass} strokeWidth={1.75} aria-hidden />} label="Phone">
                <a href={telHref(contact.phone)} className={linkClass}>
                  {contact.phone}
                </a>
              </Row>
            )}
            {contact.email && (
              <Row icon={<Mail className={iconClass} strokeWidth={1.75} aria-hidden />} label="Email">
                <a href={`mailto:${contact.email}`} className={cn(linkClass, "break-all")}>
                  {contact.email}
                </a>
              </Row>
            )}
            {(contact.address || contact.mapUrl) && (
              <Row icon={<MapPin className={iconClass} strokeWidth={1.75} aria-hidden />} label="Address">
                {contact.address && <address className="whitespace-pre-line not-italic">{contact.address}</address>}
                {contact.mapUrl && (
                  <a href={contact.mapUrl} {...externalLinkProps} className={cn(textLink, "mt-2")}>
                    Open in maps
                    <ExternalLink aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </Row>
            )}
            {contact.businessHours && (
              <Row icon={<Clock className={iconClass} strokeWidth={1.75} aria-hidden />} label="Business hours">
                {contact.businessHours}
              </Row>
            )}
          </dl>
          <SocialLinks social={social} siteName={general.siteName} className="mt-8" />
        </section>
      </div>
    </>
  );
}
