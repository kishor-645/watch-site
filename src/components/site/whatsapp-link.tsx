import { ctaPrimary, ctaSecondary } from "@/components/home/section-heading";
import { cn } from "@/lib/utils";
import { WhatsAppIcon } from "./icons";
import { externalLinkProps } from "./text";

/**
 * Styled WhatsApp call-to-action. `href` must come from `watchEnquiryUrl` / `generalEnquiryUrl`
 * (src/lib/whatsapp.ts) — never build WhatsApp URLs anywhere else.
 */
export function WhatsAppLink({
  href,
  children,
  variant = "primary",
  className,
  ariaLabel,
}: {
  href: string;
  children: React.ReactNode;
  variant?: "primary" | "secondary";
  className?: string;
  ariaLabel?: string;
}) {
  return (
    <a
      href={href}
      {...externalLinkProps}
      aria-label={ariaLabel}
      className={cn(variant === "primary" ? ctaPrimary : ctaSecondary, className)}
    >
      <WhatsAppIcon className="size-4 shrink-0" />
      {children}
      <span className="sr-only"> (opens WhatsApp in a new tab)</span>
    </a>
  );
}

/** Small round WhatsApp button fixed to the bottom-right corner of every public page. */
export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      {...externalLinkProps}
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-12 items-center justify-center rounded-full border border-gold/40 bg-background/90 text-gold shadow-lg shadow-black/40 backdrop-blur transition-colors hover:border-gold hover:bg-gold hover:text-primary-foreground sm:right-6 sm:bottom-6 sm:size-14 print:hidden"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
