"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { ArrowUpRight } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { externalLinkProps } from "@/components/site/text";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";
import { isActive, NAV, SearchForm } from "./header-client";

/**
 * Mobile menu sheet (search, pages, categories, WhatsApp). Loaded on demand by <MobileMenu>
 * (header-client.tsx), which owns the "Open menu" button and the open state.
 */
export function MobileMenuSheet({
  brand,
  tagline,
  whatsappHref,
  categories,
  open,
  onOpenChange,
  triggerRef,
}: {
  brand: React.ReactNode;
  tagline: string;
  whatsappHref: string;
  categories: { slug: string; label: string }[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  triggerRef: React.RefObject<HTMLButtonElement | null>;
}) {
  const pathname = usePathname();
  const close = () => onOpenChange(false);

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="w-[90%] gap-0 overflow-hidden border-border bg-background p-0 sm:max-w-sm"
        // No Radix Trigger (the button lives in header-client.tsx): hand focus back to it.
        onCloseAutoFocus={(e) => {
          e.preventDefault();
          triggerRef.current?.focus({ preventScroll: true });
        }}
      >
        <div aria-hidden className="orb orb-blue -right-24 -top-24 size-72" />
        <div aria-hidden className="orb orb-orange -bottom-28 -left-20 size-72" />
        <SheetHeader className="relative border-b border-border px-6 py-5">
          <SheetTitle>{brand}</SheetTitle>
          <SheetDescription className={cn("text-xs", !tagline && "sr-only")}>{tagline || "Site menu"}</SheetDescription>
        </SheetHeader>
        <div className="relative flex-1 overflow-y-auto">
          <div className="px-6 pt-6">
            <SearchForm id="mobile-menu-search" onSubmit={close} />
          </div>
          <nav aria-label="Mobile" className="px-6 pt-4">
            <ul className="flex flex-col">
              {NAV.map((item, i) => {
                const active = isActive(item.href, pathname);
                return (
                  <li key={item.href} className="border-b border-border/70">
                    <Link
                      href={item.href}
                      onClick={close}
                      aria-current={active ? "page" : undefined}
                      className={cn(
                        "group flex h-16 items-center justify-between font-display text-[2rem] font-bold leading-none tracking-[-0.03em] transition-colors duration-150",
                        active ? "text-foreground" : "text-foreground/65 hover:text-foreground",
                      )}
                    >
                      <span className="flex items-baseline gap-3">
                        <span aria-hidden className="font-sans text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        {item.label}
                      </span>
                      {active ? (
                        <span aria-hidden className="size-2.5 rounded-full bg-aurora" />
                      ) : (
                        <ArrowUpRight
                          aria-hidden
                          className="size-5 text-muted-foreground transition-transform duration-300 group-hover:-translate-y-0.5 group-hover:translate-x-0.5"
                        />
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </nav>
          {categories.length > 0 && (
            <div className="px-6 pb-8 pt-8">
              <p id="mobile-menu-categories" className="eyebrow text-muted-foreground">
                Categories
              </p>
              <ul aria-labelledby="mobile-menu-categories" className="mt-4 flex flex-wrap gap-2">
                {categories.map((c) => (
                  <li key={c.slug}>
                    <Link
                      href={`/shop?category=${encodeURIComponent(c.slug)}`}
                      onClick={close}
                      className="inline-flex min-h-10 items-center rounded-full border border-border bg-card/70 px-4 text-sm font-medium text-foreground transition-colors duration-150 hover:border-brand-ink hover:text-brand-ink"
                    >
                      {c.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
        <div className="relative border-t border-border px-6 py-5">
          <a
            href={whatsappHref}
            {...externalLinkProps}
            className="type-nav flex h-12 w-full items-center justify-center gap-3 rounded-full bg-primary font-semibold text-primary-foreground transition-colors duration-150 hover:bg-[color-mix(in_oklab,var(--primary),white_14%)]"
          >
            <WhatsAppIcon className="size-4" />
            Chat on WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
