import Link from "next/link";
import { SearchX } from "lucide-react";
import { ctaSecondary } from "@/components/home/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";

/** No results (filtered) or an empty catalogue. */
export function ShopEmpty({ filtered, whatsappHref }: { filtered: boolean; whatsappHref: string }) {
  return (
    <div className="relative isolate flex flex-col items-center overflow-hidden rounded-[2rem] border border-foreground/[0.07] bg-card px-6 py-16 text-center sm:py-20">
      <div aria-hidden className="orb orb-blue -top-32 left-1/2 -z-10 size-80 -translate-x-1/2 opacity-30" />
      <span aria-hidden className="mb-6 grid size-14 place-items-center rounded-full border border-foreground/10 bg-surface-2 text-brand-ink">
        <SearchX className="size-6" strokeWidth={1.75} />
      </span>
      <h2 className="type-h3 text-foreground">
        {filtered ? "No watches match these filters" : "Our collection is being updated"}
      </h2>
      <p className="mt-3 max-w-[44ch] text-sm leading-relaxed text-muted-foreground">
        {filtered
          ? "Try removing a filter or widening the price range. Or tell us what you are looking for and we will help you find it."
          : "New pieces are on their way. Tell us what you are looking for and we will let you know when something suitable arrives."}
      </p>
      <div className="mt-8 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
        {filtered && (
          <Link href="/shop" className={ctaSecondary}>
            Clear filters
          </Link>
        )}
        <WhatsAppLink href={whatsappHref}>Tell us what you&apos;re looking for</WhatsAppLink>
      </div>
    </div>
  );
}
