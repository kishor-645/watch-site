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

/**
 * Quiet round WhatsApp button fixed to the bottom-right corner of every public page. Hidden while
 * the product page shows its own enquiry button on screen (`body[data-page-cta]`, see globals.css).
 */
export function FloatingWhatsApp({ href }: { href: string }) {
  return (
    <a
      href={href}
      {...externalLinkProps}
      data-floating-whatsapp=""
      aria-label="Chat with us on WhatsApp (opens in a new tab)"
      className="fixed bottom-[calc(1rem+env(safe-area-inset-bottom))] right-4 z-40 inline-flex size-13 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-[0_14px_36px_-12px_rgb(255_107_44/0.8)] ring-4 ring-background/60 transition-[transform,box-shadow,opacity,visibility] duration-300 ease-snap hover:scale-105 hover:shadow-[0_18px_44px_-12px_rgb(255_107_44/0.95)] sm:bottom-6 sm:right-6 print:hidden"
    >
      <WhatsAppIcon className="size-6" />
    </a>
  );
}
