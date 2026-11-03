"use client";

import * as React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import {
  ActivityIcon,
  ExternalLinkIcon,
  LayoutDashboardIcon,
  MenuIcon,
  SettingsIcon,
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

function NavLinks({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  return (
    <nav aria-label="Admin" className="flex flex-col gap-0.5">
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
              "flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium outline-none transition-colors focus-visible:ring-3 focus-visible:ring-ring/50",
              active
                ? "bg-accent text-accent-foreground"
                : "text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <Icon className="size-4 shrink-0" aria-hidden />
            {item.label}
          </Link>
        );
      })}
      <a
        href="/"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-2 flex items-center gap-2.5 rounded-md px-2.5 py-2 text-sm font-medium text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:ring-3 focus-visible:ring-ring/50"
      >
        <ExternalLinkIcon className="size-4 shrink-0" aria-hidden />
        View site <span aria-hidden>↗</span>
        <span className="sr-only">(opens in a new tab)</span>
      </a>
    </nav>
  );
}

function UserBox({ username }: { username: string }) {
  return (
    <div className="flex flex-col gap-2 border-t border-border pt-3">
      <p className="px-2.5 text-xs text-muted-foreground">
        Signed in as <span className="font-medium text-foreground">{username}</span>
      </p>
      <LogoutButton className="justify-start" />
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
    <div className="min-h-screen bg-background font-sans md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
      <a
        href="#admin-main"
        className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-50 focus:rounded-md focus:bg-primary focus:px-3 focus:py-2 focus:text-primary-foreground"
      >
        Skip to content
      </a>

      {/* Desktop sidebar */}
      <aside className="sticky top-0 hidden h-screen flex-col gap-4 border-r border-border bg-card px-3 py-4 md:flex">
        <Link href="/admin" className="px-2.5 outline-none focus-visible:ring-3 focus-visible:ring-ring/50">
          <span className="block font-serif text-xl tracking-tight">{siteName}</span>
          <span className="block text-xs text-muted-foreground">Admin console</span>
        </Link>
        <div className="flex-1 overflow-y-auto">
          <NavLinks />
        </div>
        <UserBox username={username} />
      </aside>

      <div className="flex min-w-0 flex-col">
        {/* Mobile top bar */}
        <header className="sticky top-0 z-40 flex h-12 items-center justify-between gap-2 border-b border-border bg-card/95 px-3 backdrop-blur md:hidden">
          <Link href="/admin" className="font-serif text-lg tracking-tight">
            {siteName} <span className="font-sans text-xs text-muted-foreground">Admin</span>
          </Link>
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="left" className="w-72 gap-4 p-4">
              <SheetTitle className="font-serif text-xl">{siteName}</SheetTitle>
              <SheetDescription className="sr-only">Admin navigation</SheetDescription>
              <div className="flex-1 overflow-y-auto">
                <NavLinks onNavigate={() => setOpen(false)} />
              </div>
              <UserBox username={username} />
            </SheetContent>
          </Sheet>
        </header>

        {mustChangePassword && (
          <div role="status" className="border-b border-primary/30 bg-primary/10 px-4 py-2.5 text-sm text-foreground">
            <strong className="font-semibold">Action required:</strong> change the initial password before using the
            console.{" "}
            {pathname !== "/admin/account" && (
              <Link href="/admin/account?required=1" className="font-medium text-primary underline underline-offset-4">
                Change password
              </Link>
            )}
          </div>
        )}

        <main id="admin-main" tabIndex={-1} className="mx-auto w-full max-w-6xl flex-1 px-4 py-6 outline-none sm:px-6 lg:px-8">
          {children}
        </main>
      </div>
    </div>
  );
}
