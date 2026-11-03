import Link from "next/link";
import { ArrowUpRight, Clock, Mail, MapPin, Phone } from "lucide-react";
import { Brand } from "@/components/layout/wordmark";
import { WhatsAppIcon } from "@/components/site/icons";
import { SocialLinks } from "@/components/site/social-links";
import { externalLinkProps, telHref } from "@/components/site/text";
import type { PublicSettings } from "@/lib/types";
import { displayPhone, generalEnquiryUrl } from "@/lib/whatsapp";

const linkClass = "rounded-sm text-sm text-muted-foreground transition-colors duration-150 hover:text-foreground";
const headingClass = "eyebrow text-brand-ink";
const iconClass = "mt-0.5 size-4 shrink-0 text-muted-foreground";

const PAGES = [
  { label: "Shop all watches", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
];

/** Deepest-ink footer: brand + WhatsApp pill, categories, pages, contact, legal row and a giant outlined wordmark. */
export function Footer({ settings }: { settings: PublicSettings }) {
  const { general, contact, footer, social, catalog } = settings;
  const year = new Date().getFullYear();
  const copyright = footer.copyright || `© ${year} ${general.siteName}`;
  const whatsappDisplay = displayPhone(contact.whatsappNumber);
  const whatsappHref = generalEnquiryUrl(settings);

  return (
    <footer className="dark relative overflow-hidden bg-background text-foreground">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-aurora opacity-60" />
      <div aria-hidden className="orb orb-blue -left-40 top-10 size-96 opacity-25" />
      {/* Extra bottom padding on small screens keeps the floating WhatsApp button off the last line. */}
      <div className="relative mx-auto w-full max-w-[82.5rem] px-5 pt-20 sm:px-8 lg:px-12 lg:pt-24">
        <div className="grid grid-cols-2 gap-x-6 gap-y-12 lg:grid-cols-12">
          <div className="col-span-2 lg:col-span-4">
            <Link href="/" aria-label={`${general.siteName} — home`} className="inline-block rounded-sm">
              <Brand siteName={general.siteName} logoUrl={general.logoUrl} className="text-3xl" />
            </Link>
            {(footer.blurb || general.tagline) && (
              <p className="mt-5 max-w-sm text-sm leading-relaxed text-muted-foreground">
                {footer.blurb || general.tagline}
              </p>
            )}
            <SocialLinks social={social} siteName={general.siteName} className="mt-7" />
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

          <div className="col-span-2 lg:col-span-3">
            <h2 className={headingClass}>Contact</h2>
            <ul className="mt-5 space-y-3.5 text-sm text-muted-foreground">
              <li className="flex items-start gap-3">
                <WhatsAppIcon className={iconClass} />
                <a href={whatsappHref} {...externalLinkProps} className={linkClass}>
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

        <div className="mt-16 flex flex-col gap-4 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs text-muted-foreground">{copyright}</p>
          <a
            href="#main-content"
            className="group inline-flex items-center gap-2 self-start rounded-full text-xs font-medium text-muted-foreground transition-colors duration-150 hover:text-foreground sm:self-auto"
          >
            Back to top
            <ArrowUpRight aria-hidden className="size-3.5 -rotate-45 transition-transform duration-300 group-hover:-translate-y-0.5" />
          </a>
        </div>
      </div>

      <p
        aria-hidden
        className="text-outline pointer-events-none mt-6 select-none whitespace-nowrap pb-24 text-center font-display text-[clamp(4.5rem,1rem+17vw,17rem)] font-bold uppercase leading-[0.75] tracking-[-0.06em] sm:pb-6"
      >
        {general.siteName}
      </p>
    </footer>
  );
}
