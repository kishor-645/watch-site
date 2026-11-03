"use client";

import { useEffect, useState } from "react";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

const MOBILE = "(max-width: 767.98px)";

/**
 * Mobile-only bottom bar (price + compact enquiry button) shown once the main enquiry button
 * (`targetId`) has scrolled up out of view. While it is shown, `body[data-sticky-cta]` hides the
 * floating WhatsApp button. `href` must come from `watchEnquiryUrl` (src/lib/whatsapp.ts).
 */
export function StickyEnquiryBar({ targetId, price, href }: { targetId: string; price: string; href: string }) {
  const [shown, setShown] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const mq = window.matchMedia(MOBILE);
    let passed = false;
    const update = () => setShown(passed && mq.matches);
    const observer = new IntersectionObserver(([entry]) => {
      passed = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      update();
    });
    observer.observe(target);
    mq.addEventListener("change", update);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", update);
    };
  }, [targetId]);

  useEffect(() => {
    if (shown) document.body.setAttribute("data-sticky-cta", "");
    else document.body.removeAttribute("data-sticky-cta");
    return () => document.body.removeAttribute("data-sticky-cta");
  }, [shown]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-background pb-[env(safe-area-inset-bottom)] transition-[transform,visibility] duration-300 ease-quiet md:hidden print:hidden",
        shown ? "visible translate-y-0" : "invisible translate-y-full",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-4 px-5 sm:px-8">
        <p className="type-price-md text-foreground">{price}</p>
        <WhatsAppLink href={href} className="min-h-11 gap-2.5 px-5 py-0">
          Enquire
        </WhatsAppLink>
      </div>
    </div>
  );
}
