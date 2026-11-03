"use client";
import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";
import { Search } from "lucide-react";
import { cn } from "@/lib/utils";

// The overlay (Radix Dialog + form) is fetched on first intent, not with every page.
const loadOverlay = () => import("./search-overlay-panel");
const SearchOverlay = dynamic(() => loadOverlay().then((m) => m.SearchOverlay), { ssr: false });
const preload = () => void loadOverlay();

function isTypingTarget(el: EventTarget | null): boolean {
  if (!(el instanceof HTMLElement)) return false;
  return el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName);
}

/** Search icon button that opens a full-screen animated search overlay (submits to /shop?q=). */
export function SearchOverlayButton({
  categories,
  className,
}: {
  categories: { slug: string; label: string }[];
  className?: string;
}) {
  const [open, setOpen] = useState(false);
  // Mount the overlay on first open and keep it mounted, so its close animation can play.
  const [loaded, setLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  const show = () => {
    setLoaded(true);
    setOpen(true);
  };

  // "/" opens search when the user isn't typing and no other dialog is open.
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "/" || e.metaKey || e.ctrlKey || e.altKey || e.defaultPrevented) return;
      if (isTypingTarget(e.target) || document.querySelector('[role="dialog"]')) return;
      e.preventDefault();
      setLoaded(true);
      setOpen(true);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Search"
        aria-keyshortcuts="/"
        aria-haspopup="dialog"
        aria-expanded={open}
        title="Search ( / )"
        onPointerEnter={preload}
        onFocus={preload}
        onTouchStart={preload}
        onClick={show}
        className={cn(
          "press inline-flex size-10 items-center justify-center rounded-full text-foreground transition-colors duration-200 hover:bg-surface-2",
          className,
        )}
      >
        <Search aria-hidden className="size-5" strokeWidth={1.75} />
      </button>
      {loaded && <SearchOverlay categories={categories} open={open} onOpenChange={setOpen} triggerRef={triggerRef} />}
    </>
  );
}
