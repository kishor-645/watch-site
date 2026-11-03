import Link from "next/link";
import { Watch as WatchIcon } from "lucide-react";
import { ctaSecondary } from "@/components/home/section-heading";
import { WhatsAppLink } from "@/components/site/whatsapp-link";

/** No results (filtered) or an empty catalogue. */
export function ShopEmpty({ filtered, whatsappHref }: { filtered: boolean; whatsappHref: string }) {
  return (
    <div className="flex flex-col items-center border border-border bg-card/40 px-6 py-16 text-center md:py-24">
      <span className="grid size-14 place-items-center rounded-full border border-gold/30 text-gold">
        <WatchIcon aria-hidden className="size-6" strokeWidth={1.25} />
      </span>
      <h2 className="mt-7 font-serif text-3xl font-light md:text-4xl">
        {filtered ? "No watches match these filters" : "Our collection is being updated"}
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        {filtered
          ? "Try removing a filter or widening the price range. Or tell us what you are looking for and we will help you find it."
          : "New pieces are on their way. Tell us what you are looking for and we will let you know when something suitable arrives."}
      </p>
      <div className="mt-9 flex w-full flex-col justify-center gap-3 sm:w-auto sm:flex-row">
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
