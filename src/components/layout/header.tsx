import Link from "next/link";
import { SearchOverlayButton } from "@/components/interactive/search-overlay";
import { WishlistNavLink } from "@/components/interactive/wishlist";
import { Brand } from "@/components/layout/wordmark";
import { WhatsAppIcon } from "@/components/site/icons";
import { externalLinkProps } from "@/components/site/text";
import type { PublicSettings } from "@/lib/types";
import { generalEnquiryUrl } from "@/lib/whatsapp";
import { DesktopNav, MobileMenu, SearchForm } from "./header-client";

/** Sticky glass header: wordmark, pill navigation, search, wishlist and the WhatsApp pill. */
export function Header({ settings }: { settings: PublicSettings }) {
  const { siteName, logoUrl, tagline } = settings.general;
  const whatsappHref = generalEnquiryUrl(settings);
  const brand = <Brand siteName={siteName} logoUrl={logoUrl} className="text-[1.375rem] sm:text-2xl" />;
  const categories = settings.catalog.categories.map(({ slug, label }) => ({ slug, label }));

  return (
    <header className="sticky top-0 z-40 w-full border-b border-foreground/[0.07] bg-background/75 backdrop-blur-xl backdrop-saturate-150">
      <div className="mx-auto flex h-16 w-full max-w-[82.5rem] items-center justify-between gap-4 px-5 sm:px-8 lg:grid lg:h-[76px] lg:grid-cols-[1fr_auto_1fr] lg:px-12">
        <Link href="/" aria-label={`${siteName} — home`} className="shrink-0 justify-self-start rounded-sm">
          {brand}
        </Link>

        <DesktopNav />

        <div className="-mr-2 flex items-center gap-1 justify-self-end sm:gap-1.5 lg:mr-0">
          {/* Inline search field on wide screens; the animated search overlay below xl. */}
          <SearchForm id="header-search" className="mr-1 hidden w-52 xl:block" />
          <SearchOverlayButton categories={categories} className="xl:hidden" />
          <WishlistNavLink />
          <MobileMenu brand={brand} tagline={tagline} whatsappHref={whatsappHref} categories={categories} />
          <a
            href={whatsappHref}
            {...externalLinkProps}
            aria-label="Chat with us on WhatsApp (opens in a new tab)"
            className="type-nav ml-1 hidden h-10 items-center gap-2 rounded-full bg-primary px-4 font-semibold text-primary-foreground shadow-[0_8px_24px_-10px_rgb(255_107_44/0.8)] transition-[background-color,box-shadow] duration-300 ease-quiet hover:bg-[color-mix(in_oklab,var(--primary),white_14%)] lg:inline-flex"
          >
            <WhatsAppIcon className="size-4" />
            WhatsApp
          </a>
        </div>
      </div>
    </header>
  );
}
