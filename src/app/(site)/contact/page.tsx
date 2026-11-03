import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/home/page-hero";
import { container, textLink } from "@/components/home/section-heading";
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
  "rounded-sm text-foreground underline decoration-border underline-offset-[6px] transition-colors duration-150 hover:decoration-foreground";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-5 first:pt-0 last:border-0">
      <span className="mt-0.5 shrink-0 text-muted-foreground">{icon}</span>
      <div className="min-w-0">
        <dt className="type-small text-muted-foreground">{label}</dt>
        <dd className="mt-1 text-[0.9375rem] leading-relaxed text-foreground sm:text-base">{children}</dd>
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
      <PageHero title="Contact" description={general.tagline || undefined} />

      <div className={cn(container, "grid gap-12 py-section lg:grid-cols-12 lg:gap-16 xl:gap-24")}>
        <section
          aria-labelledby="whatsapp-heading"
          className="flex flex-col items-start bg-card p-6 sm:p-10 lg:col-span-5 lg:self-start"
        >
          <h2 id="whatsapp-heading" className="type-h3 text-foreground">
            Message us on WhatsApp
          </h2>
          {whatsappDisplay && (
            <p className="mt-4 font-sans text-xl font-medium tabular-nums text-foreground">{whatsappDisplay}</p>
          )}
          <WhatsAppLink href={whatsappHref} className="mt-8 w-full">
            Chat on WhatsApp
          </WhatsAppLink>
          {contact.businessHours && <p className="type-small mt-4 text-muted-foreground">{contact.businessHours}</p>}
        </section>

        <section aria-labelledby="details-heading" className="lg:col-span-7">
          <h2 id="details-heading" className="type-h3 text-foreground">
            {general.siteName}
          </h2>
          <dl className="mt-6">
            {contact.phone && (
              <Row icon={<Phone className={iconClass} strokeWidth={1.5} aria-hidden />} label="Phone">
                <a href={telHref(contact.phone)} className={linkClass}>
                  {contact.phone}
                </a>
              </Row>
            )}
            {contact.email && (
              <Row icon={<Mail className={iconClass} strokeWidth={1.5} aria-hidden />} label="Email">
                <a href={`mailto:${contact.email}`} className={cn(linkClass, "break-all")}>
                  {contact.email}
                </a>
              </Row>
            )}
            {(contact.address || contact.mapUrl) && (
              <Row icon={<MapPin className={iconClass} strokeWidth={1.5} aria-hidden />} label="Address">
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
              <Row icon={<Clock className={iconClass} strokeWidth={1.5} aria-hidden />} label="Business hours">
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
