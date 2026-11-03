"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ArrowUpRightIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
  TriangleAlertIcon,
  UserIcon,
  WatchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { LogoutButton } from "./logout-button";

const NAV = [
  { href: "/admin", label: "Dashboard", icon: LayoutDashboardIcon, exact: true },
  { href: "/admin/watches", label: "Watches", icon: WatchIcon },
  { href: "/admin/settings", label: "Settings", icon: SettingsIcon },
  { href: "/admin/activity", label: "Activity", icon: ActivityIcon },
  { href: "/admin/account", label: "Account", icon: UserIcon },
] as const;

function isActive(pathname: string, href: string, exact?: boolean) {
  return exact ? pathname === href : pathname === href || pathname.startsWith(`${href}/`);
}

const navItem =
  "group relative flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-2 focus-visible:ring-ring";

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-1">
      <p className="px-3 pb-1 text-[0.6875rem] font-medium tracking-[0.16em] text-muted-foreground/80 uppercase">Manage</p>
      {NAV.map((item) => {
        const active = isActive(pathname, item.href, "exact" in item ? item.exact : false);
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            onClick={onNavigate}
            aria-current={active ? "page" : undefined}
            className={cn(
              navItem,
              active
                ? "bg-white/[0.07] text-foreground shadow-[inset_0_0_0_1px_rgb(142_162_255/0.14)]"
                : "text-muted-foreground hover:bg-white/[0.04] hover:text-foreground",
            )}
          >
            {/* Aurora indicator on the active item */}
            <span
              aria-hidden
              className={cn(
                "absolute top-1/2 left-0 h-5 w-[3px] -translate-y-1/2 rounded-full bg-aurora transition-opacity",
                active ? "opacity-100" : "opacity-0",
              )}
            />
            <span
              aria-hidden
              className={cn(
                "grid size-7 shrink-0 place-items-center rounded-md transition-colors",
                active ? "bg-brand/25 text-brand-ink" : "bg-white/[0.04] text-muted-foreground group-hover:text-foreground",
              )}
            >
              <Icon className="size-4" />
            </span>
            {item.label}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className={cn(navItem, "mt-3 text-muted-foreground hover:bg-white/[0.04] hover:text-foreground")}
      >
        <span aria-hidden className="grid size-7 shrink-0 place-items-center rounded-md bg-white/[0.04]">
          <ArrowUpRightIcon className="size-4" />
        </span>
        View site
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </nav>
  );
}

function BrandMark({ siteName, compact }: { siteName: string; compact?: boolean }) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span aria-hidden className="relative grid size-8 shrink-0 place-items-center rounded-lg bg-aurora shadow-[0_6px_18px_-6px_rgb(77_107_255/0.7)]">
        <span className="size-3 rounded-full border-2 border-white/90" />
      </span>
      <span className="min-w-0">
        <span className="admin-display block truncate text-[0.95rem] leading-tight font-bold tracking-[0.08em] text-foreground uppercase">
          {siteName}
        </span>
        {!compact && <span className="block text-[0.6875rem] tracking-[0.14em] text-muted-foreground uppercase">Admin console</span>}
      </span>
    </span>
  );
}

function UserBox({ username }: { username: string }) {
  const initial = username.slice(0, 1).toUpperCase() || "A";
  return (
    <div className="flex flex-col gap-2 rounded-xl border border-border bg-white/[0.03] p-2.5">
      <div className="flex items-center gap-2.5">
        <span
          aria-hidden
          className="grid size-8 shrink-0 place-items-center rounded-full bg-aurora text-xs font-semibold text-white"
        >
          {initial}
        </span>
        <p className="min-w-0 truncate text-xs text-muted-foreground">
          Signed in as <span className="block truncate text-sm font-medium text-foreground">{username}</span>
        </p>
      </div>
      <LogoutButton className="h-8 justify-start text-muted-foreground hover:bg-white/[0.06] hover:text-foreground" />
    </div>
  );
}

export function AdminShell({
  siteName,
  username,
  mustChangePassword,
  children,
}: {
  siteName: string;
  username: string;
  mustChangePassword: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(false);
  const pathname = usePathname();

  return (
    <div
      data-admin=""
      className="min-h-screen bg-background font-sans text-foreground md:grid md:grid-cols-[16rem_minmax(0,1fr)]"
    >
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop sidebar (midnight) */}
      <aside className="dark sticky top-0 hidden h-screen flex-col gap-6 overflow-hidden border-r border-border bg-background px-3 py-5 text-foreground md:flex">
        <div aria-hidden className="admin-glow pointer-events-none absolute -top-24 -left-16 h-56 w-72 opacity-40 blur-2xl" />
        <Link
          href="/admin"
          className="relative rounded-lg px-2 outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <BrandMark siteName={siteName} />
        </Link>
        <div className="relative flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <div className="relative">
          <UserBox username={username} />
        </div>
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar (midnight) */}
        <header className="dark sticky top-0 z-40 flex h-14 items-center justify-between gap-2 border-b border-border bg-background/95 px-3 text-foreground backdrop-blur md:hidden">
          <Link href="/admin" className="min-w-0 rounded-lg outline-none focus-visible:ring-2 focus-visible:ring-ring">
            <BrandMark siteName={siteName} compact />
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                aria-label="Open menu"
                className="size-9 text-foreground hover:bg-white/[0.08]"
              >
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="dark w-72 gap-5 border-border bg-background p-4 font-sans text-foreground">
              <SheetTitle className="pr-8">
                <BrandMark siteName={siteName} />
              </SheetTitle>
              <SheetDescription className="sr-only">Admin navigation</SheetDescription>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <UserBox username={username} />
            </SheetContent>
          </Sheet>
        </header>

        {mustChangePassword && (
          <div
            role="status"
            className="flex items-start gap-2 border-b border-warning/30 bg-warning/10 px-4 py-2.5 text-sm text-foreground sm:px-6 lg:px-8"
          >
            <TriangleAlertIcon className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden />
            <p>
              <strong className="font-semibold">Action required:</strong> change the initial password before using the
              console.{" "}
              {pathname !== "/admin/account" && (
                <Link href="/admin/account?required=1" className="font-medium text-foreground underline underline-offset-4">
                  Change password
                </Link>
              )}
            </p>
          </div>
        )}

        <main
          id="admin-main"
          tabIndex={-1}
          className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 sm:py-8 lg:px-8"
        >
          {children}
        </main>
      </div>
    </div>
  );
}
