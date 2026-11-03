"use client";
import Form from "next/form";
import Link from "next/link";
import { useRef } from "react";
import { ArrowRight, Search, X } from "lucide-react";
import { Dialog as DialogPrimitive } from "radix-ui";

/**
 * Full-screen animated search overlay (submits to /shop?q=). Loaded on demand by
 * <SearchOverlayButton> (search-overlay.tsx), which owns the trigger and the open state.
 */
export function SearchOverlay({
  categories,
  open,
  onOpenChange,
  triggerRef,
}: {
  categories: { slug: string; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const setOpen = onOpenChange;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={onOpenChange}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay className="search-overlay-backdrop fixed inset-0 z-50 bg-[#05070f]/85 backdrop-blur-xl" />
        <DialogPrimitive.Content
          className="search-overlay fixed inset-0 z-50 flex flex-col overflow-y-auto outline-none"
          onOpenAutoFocus={(e) => {
            e.preventDefault();
            inputRef.current?.focus();
          }}
          // No Radix Trigger (the button lives in search-overlay.tsx): hand focus back to it.
          onCloseAutoFocus={(e) => {
            e.preventDefault();
            triggerRef.current?.focus({ preventScroll: true });
          }}
        >
          <div aria-hidden className="pointer-events-none absolute inset-x-0 top-0 h-[60vh] bg-[image:var(--gradient-glow)] opacity-80" />
          <div className="relative mx-auto flex w-full max-w-4xl flex-1 flex-col px-5 pb-16 pt-6 sm:px-8 sm:pt-10">
            <div className="flex items-center justify-between">
              <DialogPrimitive.Title className="eyebrow text-muted-foreground">Search MyWatch</DialogPrimitive.Title>
              <DialogPrimitive.Close
                aria-label="Close search"
                className="press inline-flex size-11 items-center justify-center rounded-full border border-border bg-card/70 text-foreground transition-colors hover:bg-surface-2"
              >
                <X aria-hidden className="size-5" />
              </DialogPrimitive.Close>
            </div>
            <DialogPrimitive.Description className="sr-only">
              Type a brand, model or style and press Enter to see matching watches.
            </DialogPrimitive.Description>

            <Form action="/shop" className="search-overlay-field mt-[12vh]" onSubmit={() => setOpen(false)}>
              <label htmlFor="search-overlay-q" className="sr-only">
                Search watches
              </label>
              <div className="group relative flex items-center border-b-2 border-border pb-3 transition-colors duration-300 focus-within:border-brand-ink">
                <Search aria-hidden className="mr-3 size-7 shrink-0 text-muted-foreground sm:size-9" strokeWidth={1.5} />
                <input
                  ref={inputRef}
                  id="search-overlay-q"
                  name="q"
                  type="search"
                  required
                  autoComplete="off"
                  enterKeyHint="search"
                  placeholder="Search watches…"
                  className="w-full min-w-0 bg-transparent font-display text-[clamp(1.75rem,1rem+4vw,3.75rem)] font-semibold tracking-tight text-foreground outline-none placeholder:text-muted-foreground/75 focus-visible:outline-none [&::-webkit-search-cancel-button]:hidden"
                />
                <button
                  type="submit"
                  aria-label="Submit search"
                  className="press ml-3 inline-flex size-12 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground sm:size-14"
                >
                  <ArrowRight aria-hidden className="size-5" />
                </button>
              </div>
              <span aria-hidden className="search-overlay-line block h-0.5 origin-left bg-aurora" />
            </Form>

            {categories.length > 0 && (
              <nav aria-label="Browse categories" className="mt-10">
                <p className="eyebrow mb-4 text-muted-foreground">Browse by style</p>
                <ul className="flex flex-wrap gap-2.5">
                  {categories.map((c, i) => (
                    <li key={c.slug} className="search-overlay-chip" style={{ animationDelay: `${120 + i * 40}ms` }}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(c.slug)}`}
                        onClick={() => setOpen(false)}
                        className="press inline-flex h-10 items-center rounded-full border border-border bg-card/60 px-4 text-sm font-medium text-foreground transition-colors hover:border-brand-ink hover:text-brand-ink"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            )}
            <p className="type-small mt-auto hidden pt-12 text-muted-foreground sm:block">
              Press <kbd className="rounded border border-border px-1.5 py-0.5 font-mono text-xs">Esc</kbd> to close
            </p>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
