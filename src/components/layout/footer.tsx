import Link from "next/link";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/layout/wordmark";
import { WhatsAppIcon } from "@/components/site/icons";
import { SocialLinks } from "@/components/site/social-links";
import { externalLinkProps, telHref } from "@/components/site/text";
import type { PublicSettings } from "@/lib/types";
import { displayPhone, generalEnquiryUrl } from "@/lib/whatsapp";

const linkClass = "rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";
const headingClass = "eyebrow text-brand";
const iconClass = "mt-0.5 size-4 shrink-0 text-muted-foreground";

const PAGES = [
  { label: "Shop all watches", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Dark footer band: brand, categories, pages, contact details and the legal row. */
export function Footer({ settings }: { settings: PublicSettings }) {
  const { general, contact, footer, social, catalog } = settings;
  const year = new Date().getFullYear();
  const copyright = footer.copyright || `© ${year} ${general.siteName}`;
  const whatsappDisplay = displayPhone(contact.whatsappNumber);

  return (
    <footer className="dark bg-background text-foreground">
      {/* Extra bottom padding on small screens keeps the floating WhatsApp button off the last line. */}
      <div className="mx-auto w-full max-w-[82.5rem] px-5 pb-26 pt-20 sm:px-8 sm:pb-10 lg:px-12">
        <div className="grid gap-12 md:grid-cols-2 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label={`${general.siteName} — home`} className="inline-block rounded-sm">
              <Brand siteName={general.siteName} logoUrl={general.logoUrl} />
            </Link>
            {(footer.blurb || general.tagline) && (
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {footer.blurb || general.tagline}
              </p>
            )}
          </div>

          <nav aria-labelledby="footer-categories" className="lg:col-span-3 lg:pl-6">
            <h2 id="footer-categories" className={headingClass}>
              Shop by category
            </h2>
            <ul className="mt-5 space-y-3">
              {catalog.categories.map((c) => (
                <li key={c.slug}>
                  <Link href={`/shop?category=${encodeURIComponent(c.slug)}`} className={linkClass}>
                    {c.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav aria-labelledby="footer-pages" className="lg:col-span-2">
            <h2 id="footer-pages" className={headingClass}>
              Explore
            </h2>
            <ul className="mt-5 space-y-3">
              {PAGES.map((p) => (
                <li key={p.href}>
                  <Link href={p.href} className={linkClass}>
                    {p.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>

          <div className="lg:col-span-3">
            <h2 className={headingClass}>Contact</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <WhatsAppIcon className={iconClass} />
                <a href={generalEnquiryUrl(settings)} {...externalLinkProps} className={linkClass}>
                  <span className="sr-only">WhatsApp: </span>
                  {whatsappDisplay || "Chat on WhatsApp"}
                </a>
              </li>
              {contact.phone && (
                <li className="flex items-start gap-3">
                  <Phone className={iconClass} strokeWidth={1.5} aria-hidden />
                  <a href={telHref(contact.phone)} className={linkClass}>
                    {contact.phone}
                  </a>
                </li>
              )}
              {contact.email && (
                <li className="flex items-start gap-3">
                  <Mail className={iconClass} strokeWidth={1.5} aria-hidden />
                  <a href={`mailto:${contact.email}`} className={`${linkClass} break-all`}>
                    {contact.email}
                  </a>
                </li>
              )}
              {contact.address && (
                <li className="flex items-start gap-3">
                  <MapPin className={iconClass} strokeWidth={1.5} aria-hidden />
                  <address className="whitespace-pre-line not-italic leading-relaxed">{contact.address}</address>
                </li>
              )}
              {contact.businessHours && (
                <li className="flex items-start gap-3">
                  <Clock className={iconClass} strokeWidth={1.5} aria-hidden />
                  <span>{contact.businessHours}</span>
                </li>
              )}
            </ul>
          </div>
        </div>

        <div className="mt-16 flex flex-col gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <SocialLinks social={social} siteName={general.siteName} />
        </div>
      </div>
    </footer>
  );
}
