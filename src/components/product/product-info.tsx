import Link from "next/link";
import { TrustList } from "@/components/home/trust-bar";
import { telHref } from "@/components/site/text";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import type { CurrencyOptions } from "@/lib/format";
import type { SiteSettings, Watch } from "@/lib/types";
import { AvailabilityBadge } from "./availability";
import { Price } from "./price";

const AVAILABILITY_NOTE: Partial<Record<Watch["availability"], string>> = {
  limited: "Limited stock — message us to confirm availability.",
  pre_order: "Available to order — ask us about the expected timeline.",
  sold_out: "Currently sold out — message us to ask about availability or a similar piece.",
};

const contactLink =
  "rounded-sm font-medium text-foreground underline decoration-border underline-offset-[6px] transition-colors duration-150 hover:decoration-foreground";

/** Id of the main enquiry button; the mobile sticky bar appears once it scrolls out of view. */
export const ENQUIRY_CTA_ID = "enquiry-cta";

export function ProductInfo({
  watch,
  categoryLabel,
  currency,
  contact,
  trustItems,
  enquiryHref,
}: {
  watch: Watch;
  categoryLabel: string;
  currency: CurrencyOptions;
  contact: SiteSettings["contact"];
  trustItems: SiteSettings["home"]["trustItems"];
  enquiryHref: string;
}) {
  const soldOut = watch.availability === "sold_out";
  const note = AVAILABILITY_NOTE[watch.availability];

  return (
    <div className="flex flex-col">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <span className="eyebrow text-foreground">{watch.brand}</span>
        <span aria-hidden className="text-muted-foreground">
          ·
        </span>
        <Link
          href={`/shop?category=${encodeURIComponent(watch.category)}`}
          className="eyebrow rounded-sm text-muted-foreground transition-colors duration-150 hover:text-foreground"
        >
          {categoryLabel}
        </Link>
      </p>

      <h1 className="type-h1 mt-4 text-balance text-foreground">{watch.name}</h1>
      {watch.modelNumber && (
        <p className="type-small mt-3 text-muted-foreground">
          Ref. <span className="tabular-nums text-foreground">{watch.modelNumber}</span>
        </p>
      )}

      <Price price={watch.price} originalPrice={watch.originalPrice} currency={currency} size="lg" className="mt-6" />

      <div className="mt-3">
        <AvailabilityBadge availability={watch.availability} />
        {note && <p className="type-small mt-2 max-w-[52ch] text-muted-foreground">{note}</p>}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <div id={ENQUIRY_CTA_ID}>
          <WhatsAppLink href={enquiryHref} className="min-h-13 w-full">
            {soldOut ? "Ask about availability" : "Check availability"}
          </WhatsAppLink>
        </div>
        <p className="type-small text-muted-foreground">
          The WhatsApp message is pre-filled with this watch&apos;s details — just press send.
        </p>
        {(contact.phone || contact.email) && (
          <p className="type-small text-muted-foreground">
            <>
              {contact.phone && (
                <a href={telHref(contact.phone)} className={contactLink}>
                  Call
                  <span className="sr-only"> {contact.phone}</span>
                </a>
              )}
              {contact.phone && contact.email && (
                <span aria-hidden className="px-1.5">
                  ·
                </span>
              )}
              {contact.email && (
                <a
                  href={`mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry: ${watch.name}`)}`}
                  className={contactLink}
                >
                  Email
                  <span className="sr-only"> {contact.email}</span>
                </a>
              )}
            </>
          </p>
        )}
      </div>

      <TrustList items={trustItems} className="mt-8" />

      {watch.shortDescription && (
        <p className="type-lede mt-8 max-w-[60ch] border-t border-border pt-8 text-foreground">{watch.shortDescription}</p>
      )}

      {watch.features.length > 0 && (
        <div className="mt-8">
          <h2 className="eyebrow text-muted-foreground">Highlights</h2>
          <ul className="mt-4 space-y-2.5">
            {watch.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-[0.9375rem] leading-relaxed text-foreground">
                <span aria-hidden className="mt-[0.6875rem] size-1 shrink-0 rounded-full bg-foreground" />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
