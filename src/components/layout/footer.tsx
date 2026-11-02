import Link from "next/link";
import { Mail, MapPin, Phone } from "lucide-react";
import { Wordmark } from "@/components/layout/wordmark";

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Shop by Category",
    links: [
      { label: "Chronograph", href: "/shop?category=chronograph" },
      { label: "Diver's", href: "/shop?category=diver" },
      { label: "Skeleton", href: "/shop?category=skeleton" },
      { label: "Dress", href: "/shop?category=dress" },
      { label: "Everyday Luxury", href: "/shop?category=everyday" },
    ],
  },
  {
    title: "Company",
    links: [
      { label: "About MyWatch", href: "/about" },
      { label: "The Journal", href: "/journal" },
      { label: "Flagship: Aurora", href: "/watches/mywatch-aurora-chronograph" },
      { label: "Contact", href: "/contact" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Shipping & Delivery", href: "/contact" },
      { label: "Returns & Exchanges", href: "/contact" },
      { label: "2-Year Warranty", href: "/contact" },
      { label: "Your Cart", href: "/cart" },
    ],
  },
];

type IconProps = { className?: string };

const SOCIALS: { label: string; href: string; Icon: (p: IconProps) => React.ReactElement }[] = [
  {
    label: "Instagram",
    href: "https://instagram.com",
    Icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
        <rect x="3" y="3" width="18" height="18" rx="5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="17.5" cy="6.5" r="0.75" fill="currentColor" stroke="none" />
      </svg>
    ),
  },
  {
    label: "Facebook",
    href: "https://facebook.com",
    Icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
        <path d="M15 3h-2.5A3.5 3.5 0 0 0 9 6.5V10H6.5v3.5H9V21h3.5v-7.5H15l.5-3.5h-3V7a1 1 0 0 1 1-1H15z" />
      </svg>
    ),
  },
  {
    label: "X (Twitter)",
    href: "https://x.com",
    Icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
        <path d="M17.53 3H20.6l-6.7 7.66L21.75 21h-6.17l-4.83-6.32L5.2 21H2.13l7.17-8.2L1.75 3h6.33l4.37 5.78zm-1.08 16.17h1.7L7.18 4.74H5.36z" />
      </svg>
    ),
  },
  {
    label: "YouTube",
    href: "https://youtube.com",
    Icon: ({ className }) => (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className={className} aria-hidden>
        <rect x="2.5" y="5.5" width="19" height="13" rx="4" />
        <path d="m10 9.5 5 2.5-5 2.5z" fill="currentColor" />
      </svg>
    ),
  },
];

const linkClass =
  "rounded-sm text-sm text-muted-foreground outline-none transition-colors hover:text-gold-light focus-visible:text-gold-light focus-visible:ring-2 focus-visible:ring-gold/50";

export function Footer() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative mt-24 border-t border-gold/15 bg-charcoal/40">
      <div aria-hidden className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-gold/50 to-transparent" />
      <div className="mx-auto w-full max-w-7xl px-5 py-16 sm:px-8 lg:px-12 lg:py-20">
        <div className="grid gap-12 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <Link href="/" aria-label="MyWatch home" className="inline-block rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/50">
              <Wordmark />
            </Link>
            <p className="mt-6 max-w-sm text-sm leading-relaxed text-muted-foreground">
              Authentic timepieces, chosen for their craft and finished to last a lifetime. Every watch is
              inspected by hand, then delivered fully insured across India.
            </p>
            <ul className="mt-8 space-y-3 text-sm text-muted-foreground">
              <li className="flex items-center gap-3">
                <Mail className="size-4 text-gold" strokeWidth={1.5} aria-hidden />
                <a href="mailto:concierge@mywatch.in" className={linkClass}>
                  concierge@mywatch.in
                </a>
              </li>
              <li className="flex items-center gap-3">
                <Phone className="size-4 text-gold" strokeWidth={1.5} aria-hidden />
                <a href="tel:+912240001234" className={linkClass}>
                  +91 22 4000 1234
                </a>
              </li>
              <li className="flex items-center gap-3">
                <MapPin className="size-4 text-gold" strokeWidth={1.5} aria-hidden />
                <span>Kala Ghoda, Mumbai</span>
              </li>
            </ul>
          </div>

          <div className="grid grid-cols-2 gap-10 sm:grid-cols-3 lg:col-span-8 lg:pl-12">
            {COLUMNS.map((col) => (
              <nav key={col.title} aria-label={col.title}>
                <h2 className="font-sans text-[0.65rem] font-medium uppercase tracking-[0.3em] text-gold">
                  {col.title}
                </h2>
                <ul className="mt-6 space-y-3.5">
                  {col.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={linkClass}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-16 flex flex-col-reverse gap-6 border-t border-border pt-8 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-xs tracking-wide text-muted-foreground">
            © {year} MyWatch. All rights reserved. Prices inclusive of GST.
          </p>
          <ul className="flex items-center gap-2" aria-label="Social media">
            {SOCIALS.map(({ label, href, Icon }) => (
              <li key={label}>
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={`MyWatch on ${label}`}
                  className="inline-flex size-9 items-center justify-center rounded-full border border-border text-muted-foreground outline-none transition-colors hover:border-gold/50 hover:text-gold focus-visible:border-gold focus-visible:text-gold focus-visible:ring-2 focus-visible:ring-gold/40"
                >
                  <Icon className="size-4" />
                </a>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </footer>
  );
}
