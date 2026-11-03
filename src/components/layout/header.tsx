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
  const brand = <Brand siteName={siteName} logoUrl={logoUrl} className="text-xl sm:text-[1.375rem]" />;
  const categories = settings.catalog.categories.map(({ slug, label }) => ({ slug, label }));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-border bg-background/92 backdrop-blur-md">
      <div className="mx-auto flex h-16 w-full max-w-[82.5rem] items-center justify-between gap-4 px-5 sm:px-8 lg:grid lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <Link href="/" aria-label={`${siteName} — home`} className="shrink-0 justify-self-start rounded-sm">
          {brand}
        </Link>

        <DesktopNav />

        <div className="-mr-2.5 flex items-center justify-self-end lg:mr-0 lg:gap-5">
          <SearchForm id="header-search" className="hidden w-56 xl:block" />
          <MobileMenu brand={brand} tagline={tagline} whatsappHref={whatsappHref} categories={categories} />
          <a
            href={whatsappHref}
            {...externalLinkProps}
            aria-label="Chat with us on WhatsApp (opens in a new tab)"
            className="type-nav hidden items-center gap-2 rounded-sm py-2 text-foreground/70 transition-colors duration-150 hover:text-foreground lg:inline-flex"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
