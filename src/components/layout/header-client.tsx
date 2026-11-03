"use client";

import { useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { externalLinkProps } from "@/components/site/text";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { cn } from "@/lib/utils";

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/watches");
  return pathname.startsWith(href);
}

export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-8">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "relative py-2 text-[0.7rem] font-medium uppercase tracking-[0.26em] transition-colors",
                  "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-300",
                  active
                    ? "text-gold after:scale-x-100"
                    : "text-foreground/75 after:scale-x-0 hover:text-foreground hover:after:scale-x-100",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** GET form to /shop?q= — works without JavaScript; `next/form` adds client-side navigation. */
export function SearchForm({
  id,
  className,
  autoFocus,
  onSubmit,
}: {
  /** Must be unique on the page: the header and the mobile menu each render a search form. */
  id: string;
  className?: string;
  autoFocus?: boolean;
  onSubmit?: () => void;
}) {
  return (
    <Form action="/shop" role="search" className={cn("relative", className)} onSubmit={onSubmit}>
      <label htmlFor={id} className="sr-only">
        Search watches
      </label>
      <input
        id={id}
        name="q"
        type="search"
        placeholder="Search watches"
        autoComplete="off"
        autoFocus={autoFocus}
        maxLength={80}
        className="h-10 w-full rounded-full border border-border bg-background/60 pl-10 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-gold/60"
      />
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </Form>
  );
}

export function MobileMenu({
  brand,
  tagline,
  whatsappHref,
}: {
  brand: React.ReactNode;
  tagline: string;
  whatsappHref: string;
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = () => setOpen(false);

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <button
          type="button"
          aria-label="Open menu"
          className="inline-flex size-10 items-center justify-center rounded-full text-foreground/85 transition-colors hover:text-gold lg:hidden"
        >
          <Menu className="size-5" strokeWidth={1.5} aria-hidden />
        </button>
      </SheetTrigger>
      <SheetContent side="right" className="w-[88%] gap-0 border-gold/15 bg-background p-0 sm:max-w-sm">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle>{brand}</SheetTitle>
          <SheetDescription className={cn("text-xs", !tagline && "sr-only")}>{tagline || "Site menu"}</SheetDescription>
        </SheetHeader>
        <div className="px-6 pt-5">
          <SearchForm id="mobile-menu-search" onSubmit={close} />
        </div>
        <nav aria-label="Mobile" className="flex-1 overflow-y-auto px-6 py-4">
          <ul className="flex flex-col">
            {NAV.map((item) => {
              const active = isActive(item.href, pathname);
              return (
                <li key={item.href} className="border-b border-border/60">
                  <Link
                    href={item.href}
                    onClick={close}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "flex items-center justify-between py-4 font-serif text-2xl transition-colors",
                      active ? "text-gold" : "text-foreground hover:text-gold-light",
                    )}
                  >
                    {item.label}
                    {active && <span aria-hidden className="h-px w-6 bg-gold" />}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
        <div className="border-t border-border px-6 py-6">
          <a
            href={whatsappHref}
            {...externalLinkProps}
            className="flex h-12 w-full items-center justify-center gap-3 bg-gold text-[0.7rem] font-medium uppercase tracking-[0.25em] text-primary-foreground transition-colors hover:bg-gold-light"
          >
            <WhatsAppIcon className="size-4" />
            Chat on WhatsApp
          </a>
        </div>
      </SheetContent>
    </Sheet>
  );
}
