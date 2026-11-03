"use client";
import dynamic from "next/dynamic";
import { useRef, useState } from "react";
import { Eye } from "lucide-react";
import type { CurrencyOptions } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { QuickViewWatch } from "./types";

// The modal (Radix Dialog, gallery, details) is fetched on first intent instead of shipping with
// every page that lists cards; `preload` warms it on hover/focus/touch so opening feels instant.
const loadDialog = () => import("./quick-view-dialog");
const QuickViewDialog = dynamic(() => loadDialog().then((m) => m.QuickViewDialog), { ssr: false });
const preload = () => void loadDialog();

/** "Quick view" trigger + animated modal. `enquiryUrl` is the server-built WhatsApp link for this watch. */
export function QuickViewButton({
  watch,
  currency,
  enquiryUrl,
  className,
}: {
  watch: QuickViewWatch;
  currency: CurrencyOptions;
  enquiryUrl: string;
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Bumped on every open: remounts the (closed) dialog so it always starts on the first image.
  const [session, setSession] = useState(0);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      {/* Own button (not DialogTrigger) so it is safe even inside a card link: never navigates. */}
      <button
        ref={triggerRef}
        type="button"
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={`Quick view: ${watch.name}`}
        onPointerEnter={preload}
        onFocus={preload}
        onTouchStart={preload}
        onClick={(e) => {
          e.preventDefault();
          e.stopPropagation();
          setSession((s) => s + 1);
          setOpen(true);
        }}
        className={cn(
          "quick-view-trigger press inline-flex h-9 items-center gap-1.5 rounded-full border border-white/15 bg-background/80 px-3.5 text-xs font-semibold text-foreground shadow-sm backdrop-blur-md transition-colors hover:bg-background",
          className,
        )}
      >
        <Eye aria-hidden className="size-3.5" />
        Quick view
      </button>
      {session > 0 && (
        <QuickViewDialog
          key={session}
          watch={watch}
          currency={currency}
          enquiryUrl={enquiryUrl}
          open={open}
          onOpenChange={setOpen}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}
