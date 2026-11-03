"use client";

import { useEffect, useState } from "react";
import { WhatsAppLink } from "@/components/site/whatsapp-link";
import { cn } from "@/lib/utils";

const MOBILE = "(max-width: 767.98px)";

/**
 * Mobile-only bottom bar (price + compact enquiry button) shown once the main enquiry button
 * (`targetId`) has scrolled up out of view. `href` must come from `watchEnquiryUrl` (src/lib/whatsapp.ts).
 *
 * It also sets `body[data-page-cta]` (see globals.css) on mobile whenever the page already offers an
 * enquiry button on screen: while the price card (`panelId`) or the main button is visible, or while
 * this bar is shown. The floating WhatsApp button steps aside then, so it never sits on top of the
 * price card or the bar; above the purchase block it stays available.
 */
export function StickyEnquiryBar({
  targetId,
  panelId,
  name,
  price,
  href,
}: {
  targetId: string;
  /** Price card above the main enquiry button. */
  panelId?: string;
  /** Watch name, shown above the price. */
  name?: string;
  price: string;
  href: string;
}) {
  const [shown, setShown] = useState(false);
  const [ctaOnScreen, setCtaOnScreen] = useState(false);

  useEffect(() => {
    const target = document.getElementById(targetId);
    if (!target || typeof IntersectionObserver === "undefined") return;
    const panel = panelId ? document.getElementById(panelId) : null;
    const mq = window.matchMedia(MOBILE);
    let passed = false;
    const visible = new Set<Element>();
    const update = () => {
      setShown(passed && mq.matches);
      setCtaOnScreen(visible.size > 0 && mq.matches);
    };
    const observer = new IntersectionObserver((entries) => {
      for (const entry of entries) {
        if (entry.isIntersecting) visible.add(entry.target);
        else visible.delete(entry.target);
        if (entry.target === target) passed = !entry.isIntersecting && entry.boundingClientRect.bottom < 0;
      }
      update();
    });
    observer.observe(target);
    if (panel) observer.observe(panel);
    mq.addEventListener("change", update);
    return () => {
      observer.disconnect();
      mq.removeEventListener("change", update);
    };
  }, [targetId, panelId]);

  const hideFloating = shown || ctaOnScreen;
  useEffect(() => {
    if (hideFloating) document.body.setAttribute("data-page-cta", "");
    else document.body.removeAttribute("data-page-cta");
    return () => document.body.removeAttribute("data-page-cta");
  }, [hideFloating]);

  return (
    <div
      className={cn(
        "fixed inset-x-0 bottom-0 z-40 px-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] transition-[transform,visibility] duration-300 ease-quiet md:hidden print:hidden",
        shown ? "visible translate-y-0" : "invisible translate-y-full",
      )}
    >
      <div className="flex h-16 items-center justify-between gap-3 rounded-full border border-foreground/10 bg-background/80 pl-5 pr-2 shadow-[var(--shadow-lift)] backdrop-blur-xl">
        <p className="min-w-0">
          {name && <span className="block truncate text-xs text-muted-foreground">{name}</span>}
          <span className="type-price-md block font-semibold text-foreground">{price}</span>
        </p>
        <WhatsAppLink href={href} className="min-h-12 shrink-0 gap-2.5 px-5 py-0">
          Enquire
        </WhatsAppLink>
      </div>
    </div>
  );
}
