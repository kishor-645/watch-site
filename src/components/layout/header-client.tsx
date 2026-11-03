"use client";

import { useRef, useState } from "react";
import dynamic from "next/dynamic";
import Form from "next/form";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export const NAV = [
  { label: "Home", href: "/" },
  { label: "Shop", href: "/shop" },
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

export function isActive(href: string, pathname: string): boolean {
  if (href === "/") return pathname === "/";
  if (href === "/shop") return pathname.startsWith("/shop") || pathname.startsWith("/watches");
  return pathname.startsWith(href);
}

/** Pill navigation: the active page sits in a cream pill, hover shows a soft glass pill. */
export function DesktopNav() {
  const pathname = usePathname();
  return (
    <nav aria-label="Primary" className="hidden lg:block">
      <ul className="flex items-center gap-1 rounded-full border border-foreground/[0.08] bg-card/60 p-1 shadow-[inset_0_1px_0_rgb(244_238_227/0.04)]">
        {NAV.map((item) => {
          const active = isActive(item.href, pathname);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "type-nav block rounded-full px-4 py-2.5 font-semibold transition-[background-color,color] duration-300 ease-quiet",
                  active
                    ? "bg-foreground text-background"
                    : "text-foreground/70 hover:bg-foreground/[0.08] hover:text-foreground",
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
        className="h-10 w-full rounded-full border border-foreground/[0.1] bg-card/70 pl-10 pr-4 text-sm text-foreground transition-[border-color,background-color] duration-300 placeholder:text-muted-foreground hover:border-foreground/25 focus:border-ring focus:bg-card"
      />
      <Search aria-hidden className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </Form>
  );
}

const iconButton =
  "inline-flex size-11 items-center justify-center rounded-full text-foreground transition-colors duration-150 hover:bg-foreground/[0.08]";

// The sheet (Radix Dialog, nav, categories) is fetched on first intent, not with every page.
const loadSheet = () => import("./mobile-menu-sheet");
const MobileMenuSheet = dynamic(() => loadSheet().then((m) => m.MobileMenuSheet), { ssr: false });
const preloadSheet = () => void loadSheet();

/** Menu button below `lg`; opens the menu sheet (mobile-menu-sheet.tsx: search, pages, categories, WhatsApp). */
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
  const [open, setOpen] = useState(false);
  // Mount the sheet on first open and keep it mounted, so its close animation can play.
  const [loaded, setLoaded] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label="Open menu"
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={preloadSheet}
        onFocus={preloadSheet}
        onTouchStart={preloadSheet}
        onClick={() => {
          setLoaded(true);
          setOpen(true);
        }}
        className={cn(iconButton, "lg:hidden")}
      >
        <Menu className="size-5" strokeWidth={1.75} aria-hidden />
      </button>
      {loaded && (
        <MobileMenuSheet
          brand={brand}
          tagline={tagline}
          whatsappHref={whatsappHref}
          categories={categories}
          open={open}
          onOpenChange={setOpen}
          triggerRef={triggerRef}
        />
      )}
    </>
  );
}
