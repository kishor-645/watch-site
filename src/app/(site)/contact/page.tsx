import type { Metadata } from "next";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { PageHero } from "@/components/home/page-hero";
import { container } from "@/components/home/section-heading";
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

const linkClass = "rounded-sm text-foreground transition-colors hover:text-gold-light";

function Row({ icon, label, children }: { icon: React.ReactNode; label: string; children: React.ReactNode }) {
  return (
    <div className="flex gap-4 border-b border-border py-5 last:border-0">
      <span className="mt-0.5 shrink-0 text-gold">{icon}</span>
      <div className="min-w-0">
        <dt className="text-[0.65rem] font-medium uppercase tracking-[0.28em] text-muted-foreground">{label}</dt>
        <dd className="mt-1.5 text-sm leading-relaxed sm:text-base">{children}</dd>
      </div>
    </div>
  );
}

export default async function ContactPage() {
  const settings = await getSiteSettings();
  const { contact, general, social } = settings;
  const whatsappHref = generalEnquiryUrl(settings);
  const whatsappDisplay = displayPhone(contact.whatsappNumber);
  const iconClass = "size-5";

  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="We are here to help"
        description="The quickest way to reach us is WhatsApp — ask about availability, pricing or request more photos of any watch."
      />

      <div className={cn(container, "grid gap-10 pt-14 lg:grid-cols-12 lg:gap-16 lg:pt-20")}>
        <section
          aria-labelledby="whatsapp-heading"
          className="flex flex-col items-start border border-gold/25 bg-charcoal/60 p-8 sm:p-10 lg:col-span-5 lg:self-start"
        >
          <span className="grid size-12 place-items-center rounded-full border border-gold/40 text-gold">
            <WhatsAppIcon className="size-6" />
          </span>
          <h2 id="whatsapp-heading" className="mt-6 text-3xl font-medium">
            Message us on WhatsApp
          </h2>
          <p className="mt-3 text-muted-foreground">
            Send us a message any time{contact.businessHours ? ` — we reply during business hours (${contact.businessHours})` : ""}.
          </p>
          {whatsappDisplay && <p className="mt-6 font-serif text-2xl tabular-nums text-gold">{whatsappDisplay}</p>}
          <WhatsAppLink href={whatsappHref} className="mt-8 w-full sm:w-auto">
            Chat on WhatsApp
          </WhatsAppLink>
        </section>

        <section aria-labelledby="details-heading" className="lg:col-span-7">
          <h2 id="details-heading" className="text-3xl font-medium">
            {general.siteName}
          </h2>
          <dl className="mt-4">
            {contact.phone && (
              <Row icon={<Phone className={iconClass} strokeWidth={1.25} aria-hidden />} label="Phone">
                <a href={telHref(contact.phone)} className={linkClass}>
                  {contact.phone}
                </a>
              </Row>
            )}
            {contact.email && (
              <Row icon={<Mail className={iconClass} strokeWidth={1.25} aria-hidden />} label="Email">
                <a href={`mailto:${contact.email}`} className={cn(linkClass, "break-all")}>
                  {contact.email}
                </a>
              </Row>
            )}
            {(contact.address || contact.mapUrl) && (
              <Row icon={<MapPin className={iconClass} strokeWidth={1.25} aria-hidden />} label="Address">
                {contact.address && (
                  <address className="whitespace-pre-line not-italic text-foreground">{contact.address}</address>
                )}
                {contact.mapUrl && (
                  <a
                    href={contact.mapUrl}
                    {...externalLinkProps}
                    className="mt-2 inline-flex items-center gap-2 text-sm text-gold underline-offset-4 hover:underline"
                  >
                    Open in maps
                    <ExternalLink aria-hidden className="size-3.5" />
                    <span className="sr-only">(opens in a new tab)</span>
                  </a>
                )}
              </Row>
            )}
            {contact.businessHours && (
              <Row icon={<Clock className={iconClass} strokeWidth={1.25} aria-hidden />} label="Business hours">
                <span className="text-foreground">{contact.businessHours}</span>
              </Row>
            )}
          </dl>
          <SocialLinks social={social} siteName={general.siteName} className="mt-8" />
        </section>
      </div>
    </>
  );
}
