"use client";

import { useRef, useState } from "react";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { WhatsAppIcon } from "@/components/site/icons";
import { externalLinkProps } from "@/components/site/text";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
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
      <ul className="flex items-center gap-9">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "type-nav relative block py-2 transition-colors duration-150",
                  "after:absolute after:inset-x-0 after:bottom-0 after:h-px after:origin-left after:bg-brand after:transition-transform after:duration-300 after:ease-quiet",
                  active
                    ? "text-foreground after:scale-x-100"
                    : "text-foreground/70 after:scale-x-0 hover:text-foreground hover:after:scale-x-100",
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
        className="h-10 w-full rounded-sm border border-input bg-card pl-10 pr-3 text-sm text-foreground placeholder:text-muted-foreground"
      />
      <Search aria-hidden className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </Form>
  );
}

const iconButton =
  "inline-flex size-11 items-center justify-center rounded-sm text-foreground transition-colors duration-150 hover:bg-accent";

/**
 * Menu sheet (search, pages, categories, WhatsApp). Opened by the menu button below `lg`, and by
 * the search button below `xl` (then the search field is focused).
 */
export function MobileMenu({
  brand,
  tagline,
  whatsappHref,
  categories,
}: {
  brand: React.ReactNode;
  tagline: string;
  whatsappHref: string;
  categories: { slug: string; label: string }[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const focusSearch = useRef(false);
  const searchButton = useRef<HTMLButtonElement>(null);
  const menuButton = useRef<HTMLButtonElement>(null);
  const close = () => setOpen(false);
  const openWith = (search: boolean) => {
    focusSearch.current = search;
    setOpen(true);
  };
  const triggerProps = { type: "button", "aria-haspopup": "dialog", "aria-expanded": open } as const;

  return (
    <>
      <button
        {...triggerProps}
        ref={searchButton}
        aria-label="Open search"
        onClick={() => openWith(true)}
        className={cn(iconButton, "xl:hidden")}
      >
        <Search className="size-5" strokeWidth={1.5} aria-hidden />
      </button>
      <button
        {...triggerProps}
        ref={menuButton}
        aria-label="Open menu"
        onClick={() => openWith(false)}
        className={cn(iconButton, "lg:hidden")}
      >
        <Menu className="size-5" strokeWidth={1.5} aria-hidden />
      </button>
      <Sheet open={open} onOpenChange={setOpen}>
        <SheetContent
          side="right"
          className="w-[88%] gap-0 border-border bg-background p-0 sm:max-w-sm"
          onOpenAutoFocus={(e) => {
            if (!focusSearch.current) return;
            e.preventDefault();
            document.getElementById("mobile-menu-search")?.focus();
          }}
          onCloseAutoFocus={(e) => {
            // No SheetTrigger (two buttons open this sheet): return focus to the one that opened it.
            const opener = focusSearch.current ? searchButton.current : menuButton.current;
            if (opener && opener.offsetParent !== null) {
              e.preventDefault();
              opener.focus();
            }
          }}
        >
          <SheetHeader className="border-b border-border px-6 py-5">
            <SheetTitle>{brand}</SheetTitle>
            <SheetDescription className={cn("text-xs", !tagline && "sr-only")}>{tagline || "Site menu"}</SheetDescription>
          </SheetHeader>
          <div className="flex-1 overflow-y-auto">
            <div className="px-6 pt-5">
              <SearchForm id="mobile-menu-search" onSubmit={close} />
            </div>
            <nav aria-label="Mobile" className="px-6 pt-3">
              <ul className="flex flex-col">
                {NAV.map((item) => {
                  const active = isActive(item.href, pathname);
                  return (
                    <li key={item.href} className="border-b border-border">
                      <Link
                        href={item.href}
                        onClick={close}
                        aria-current={active ? "page" : undefined}
                        className="flex h-14 items-center justify-between font-serif text-[1.75rem] leading-none text-foreground transition-colors duration-150 hover:text-foreground/70"
                      >
                        {item.label}
                        {active && <span aria-hidden className="h-px w-6 bg-brand" />}
                      </Link>
                    </li>
                  );
                })}
              </ul>
            </nav>
            {categories.length > 0 && (
              <div className="px-6 pb-6 pt-8">
                <p id="mobile-menu-categories" className="eyebrow text-muted-foreground">
                  Categories
                </p>
                <ul aria-labelledby="mobile-menu-categories" className="mt-3 flex flex-col">
                  {categories.map((c) => (
                    <li key={c.slug}>
                      <Link
                        href={`/shop?category=${encodeURIComponent(c.slug)}`}
                        onClick={close}
                        className="flex min-h-11 items-center text-[0.9375rem] text-foreground transition-colors duration-150 hover:text-foreground/70"
                      >
                        {c.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
          <div className="border-t border-border px-6 py-5">
            <a
              href={whatsappHref}
              {...externalLinkProps}
              className="type-nav flex h-12 w-full items-center justify-center gap-3 rounded-sm bg-primary text-primary-foreground transition-colors duration-150 hover:bg-foreground/85"
            >
              <WhatsAppIcon className="size-4" />
              Chat on WhatsApp
            </a>
          </div>
        </SheetContent>
      </Sheet>
    </>
  );
}
