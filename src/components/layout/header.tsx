"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Menu, ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import { cn } from "@/lib/utils";
import { Wordmark } from "@/components/layout/wordmark";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";

interface NavItem {
  label: string;
  href: string;
  isActive?: (pathname: string) => boolean;
}

const NAV: NavItem[] = [
  { label: "Home", href: "/", isActive: (p) => p === "/" },
  { label: "Shop", href: "/shop", isActive: (p) => p.startsWith("/shop") || p.startsWith("/watches") },
  // Collections is an alias into the shop; it never claims the active state so only one link highlights.
  { label: "Collections", href: "/shop" },
  { label: "Journal", href: "/journal", isActive: (p) => p.startsWith("/journal") },
  { label: "About", href: "/about", isActive: (p) => p.startsWith("/about") },
  { label: "Contact", href: "/contact", isActive: (p) => p.startsWith("/contact") },
];

export function Header() {
  const pathname = usePathname();
  const { count, hydrated } = useCart();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  const showBadge = hydrated && count > 0;
  const cartLabel = hydrated ? `Cart, ${count} ${count === 1 ? "item" : "items"}` : "Cart";

  return (
    <header
      className={cn(
        "sticky top-0 z-40 w-full border-b transition-[background-color,border-color,backdrop-filter] duration-500",
        scrolled
          ? "border-gold/15 bg-background/80 backdrop-blur-xl supports-[backdrop-filter]:bg-background/65"
          : "border-transparent bg-transparent",
      )}
    >
      <div className="mx-auto flex h-16 w-full max-w-7xl items-center justify-between gap-6 px-5 sm:px-8 lg:h-20 lg:px-12">
        <Link
          href="/"
          aria-label="MyWatch home"
          className="rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-gold/60 focus-visible:ring-offset-4 focus-visible:ring-offset-background"
        >
          <Wordmark className="text-xl sm:text-2xl" />
        </Link>

        <nav aria-label="Primary" className="hidden lg:block">
          <ul className="flex items-center gap-9">
            {NAV.map((item) => {
              const active = item.isActive?.(pathname) ?? false;
              return (
                <li key={item.label}>
                  <Link
                    href={item.href}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "relative py-2 text-[0.7rem] font-medium uppercase tracking-[0.28em] outline-none transition-colors",
                      "after:absolute after:inset-x-0 after:-bottom-0.5 after:h-px after:origin-left after:bg-gold after:transition-transform after:duration-500",
                      "focus-visible:text-gold-light focus-visible:after:scale-x-100",
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

        <div className="flex items-center gap-1 sm:gap-2">
          <Link
            href="/cart"
            aria-label={cartLabel}
            className={cn(
              "relative inline-flex size-10 items-center justify-center rounded-full text-foreground/85 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/60",
              pathname.startsWith("/cart") && "text-gold",
            )}
          >
            <ShoppingBag className="size-5" strokeWidth={1.5} aria-hidden />
            {showBadge && (
              <span
                aria-hidden
                className="absolute right-0.5 top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gold px-1 text-[0.6rem] font-semibold leading-none text-primary-foreground"
              >
                {count > 99 ? "99+" : count}
              </span>
            )}
          </Link>

          <Sheet>
            <SheetTrigger asChild>
              <button
                type="button"
                aria-label="Open menu"
                className="inline-flex size-10 items-center justify-center rounded-full text-foreground/85 outline-none transition-colors hover:text-gold focus-visible:ring-2 focus-visible:ring-gold/60 lg:hidden"
              >
                <Menu className="size-5" strokeWidth={1.5} aria-hidden />
              </button>
            </SheetTrigger>
            <SheetContent side="right" className="w-[85%] border-gold/15 bg-background p-0 sm:max-w-sm">
              <SheetHeader className="border-b border-border px-6 py-5">
                <SheetTitle>
                  <Wordmark className="text-xl" />
                </SheetTitle>
                <SheetDescription className="text-[0.65rem] uppercase tracking-[0.3em]">
                  Timeless luxury
                </SheetDescription>
              </SheetHeader>
              <nav aria-label="Mobile" className="flex-1 px-6 py-4">
                <ul className="flex flex-col">
                  {NAV.map((item) => {
                    const active = item.isActive?.(pathname) ?? false;
                    return (
                      <li key={item.label} className="border-b border-border/60">
                        <SheetClose asChild>
                          <Link
                            href={item.href}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex items-center justify-between py-4 font-serif text-2xl outline-none transition-colors focus-visible:text-gold-light",
                              active ? "text-gold" : "text-foreground hover:text-gold-light",
                            )}
                          >
                            {item.label}
                            {active && <span aria-hidden className="h-px w-6 bg-gold" />}
                          </Link>
                        </SheetClose>
                      </li>
                    );
                  })}
                </ul>
              </nav>
              <div className="border-t border-border px-6 py-6 text-xs leading-relaxed text-muted-foreground">
                <p className="uppercase tracking-[0.25em] text-gold">Concierge</p>
                <p className="mt-2">concierge@mywatch.in · +91 22 4000 1234</p>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
