import Link from "next/link";
import { Check, Mail, Phone } from "lucide-react";
import { ctaSecondary } from "@/components/home/section-heading";
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

export function ProductInfo({
  watch,
  categoryLabel,
  currency,
  contact,
  enquiryHref,
}: {
  watch: Watch;
  categoryLabel: string;
  currency: CurrencyOptions;
  contact: SiteSettings["contact"];
  enquiryHref: string;
}) {
  const soldOut = watch.availability === "sold_out";
  const note = AVAILABILITY_NOTE[watch.availability];

  return (
    <div className="flex flex-col">
      <p className="flex flex-wrap items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
        {watch.brand}
        <span aria-hidden className="h-px w-6 bg-gold/50" />
        <Link
          href={`/shop?category=${encodeURIComponent(watch.category)}`}
          className="rounded-sm text-muted-foreground transition-colors hover:text-gold"
        >
          {categoryLabel}
        </Link>
      </p>

      <h1 className="mt-4 text-4xl font-light leading-[1.05] sm:text-5xl">{watch.name}</h1>
      {watch.modelNumber && (
        <p className="mt-3 text-xs uppercase tracking-[0.25em] text-muted-foreground">
          Ref. <span className="text-foreground/80">{watch.modelNumber}</span>
        </p>
      )}

      <Price
        price={watch.price}
        originalPrice={watch.originalPrice}
        currency={currency}
        size="lg"
        className="mt-7"
      />

      <div className="mt-5">
        <AvailabilityBadge availability={watch.availability} className="text-[0.7rem]" />
        {note && <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{note}</p>}
      </div>

      <div className="mt-8 flex flex-col gap-3">
        <WhatsAppLink href={enquiryHref} className="w-full sm:text-xs">
          {soldOut ? "Ask about availability" : "Check availability"}
        </WhatsAppLink>
        {(contact.phone || contact.email) && (
          <div className="flex flex-col gap-3 sm:flex-row">
            {contact.phone && (
              <a href={telHref(contact.phone)} className={`${ctaSecondary} flex-1`}>
                <Phone className="size-4" strokeWidth={1.5} aria-hidden />
                Call
                <span className="sr-only"> {contact.phone}</span>
              </a>
            )}
            {contact.email && (
              <a
                href={`mailto:${contact.email}?subject=${encodeURIComponent(`Enquiry: ${watch.name}`)}`}
                className={`${ctaSecondary} flex-1`}
              >
                <Mail className="size-4" strokeWidth={1.5} aria-hidden />
                Email
                <span className="sr-only"> {contact.email}</span>
              </a>
            )}
          </div>
        )}
        <p className="text-xs leading-relaxed text-muted-foreground">
          The WhatsApp message is pre-filled with this watch&apos;s details — just press send.
        </p>
      </div>

      {watch.shortDescription && (
        <p className="mt-8 max-w-xl border-t border-border pt-8 text-base leading-relaxed text-foreground/85">
          {watch.shortDescription}
        </p>
      )}

      {watch.features.length > 0 && (
        <div className="mt-8">
          <h2 className="font-sans text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Highlights</h2>
          <ul className="mt-4 space-y-3">
            {watch.features.map((f) => (
              <li key={f} className="flex items-start gap-3 text-sm leading-relaxed text-foreground/85">
                <Check aria-hidden className="mt-0.5 size-4 shrink-0 text-gold" strokeWidth={1.75} />
                {f}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}
