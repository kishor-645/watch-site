import Link from "next/link";
import { ctaSecondary } from "@/components/home/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";

/** No results (filtered) or an empty catalogue. */
export function ShopEmpty({ filtered, whatsappHref }: { filtered: boolean; whatsappHref: string }) {
  return (
    <div className="flex flex-col items-center border border-border bg-card px-6 py-16 text-center">
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
