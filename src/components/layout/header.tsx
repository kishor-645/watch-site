import Link from "next/link";
import { Brand } from "@/components/layout/wordmark";
import { WhatsAppIcon } from "@/components/site/icons";
import { externalLinkProps } from "@/components/site/text";
import type { PublicSettings } from "@/lib/types";
import { generalEnquiryUrl } from "@/lib/whatsapp";
import { DesktopNav, MobileMenu, SearchForm } from "./header-client";

export function Header({ settings }: { settings: PublicSettings }) {
  const { siteName, logoUrl, tagline } = settings.general;
  const whatsappHref = generalEnquiryUrl(settings);
  const brand = <Brand siteName={siteName} logoUrl={logoUrl} className="text-xl sm:text-2xl" />;

  return (
    <header className="sticky top-0 z-40 w-full border-b border-gold/10 bg-background/85 backdrop-blur-md supports-[backdrop-filter]:bg-background/70">
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link href="/" aria-label={`${siteName} — home`} className="shrink-0 rounded-sm">
          {brand}
        </Link>

        <DesktopNav />

        <div className="flex items-center gap-1 sm:gap-2">
          <SearchForm id="header-search" className="hidden w-48 md:block xl:w-60" />
          <a
            href={whatsappHref}
            {...externalLinkProps}
            aria-label="Chat with us on WhatsApp (opens in a new tab)"
            className="inline-flex size-10 items-center justify-center gap-2 rounded-full text-foreground/85 transition-colors hover:text-gold xl:w-auto xl:border xl:border-gold/30 xl:px-4 xl:text-[0.65rem] xl:font-medium xl:uppercase xl:tracking-[0.22em]"
          >
            <WhatsAppIcon className="size-5 xl:size-4" />
            <span aria-hidden className="hidden xl:inline">
              WhatsApp
            </span>
          </a>
          <MobileMenu brand={brand} tagline={tagline} whatsappHref={whatsappHref} />
        </div>
      </div>
    </header>
  );
}
