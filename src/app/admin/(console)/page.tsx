import type { Metadata } from "next";
import Link from "next/link";
import { ExternalLinkIcon, PencilIcon, PlusIcon, SettingsIcon, WatchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge, EmptyState, PageHeader, StatusBadge, Thumb } from "@/components/admin/page-parts";
import { SeedCatalogButton } from "@/components/admin/seed-catalog-button";
import { formatDate, formatPrice } from "@/lib/format";
import { AVAILABILITY, availabilityLabels } from "@/lib/schemas/watch";
import { requireAdminPage } from "@/server/auth/session";
import { getDashboardStats } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

export default async function DashboardPage() {
  await requireAdminPage();
  const [stats, settings] = await Promise.all([getDashboardStats(), loadSettings()]);

  const quickActions = (
    <>
      <Button asChild size="lg">
        <Link href="/admin/watches/new">
          <PlusIcon aria-hidden /> Add watch
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <Link href="/admin/settings">
          <SettingsIcon aria-hidden /> Edit settings
        </Link>
      </Button>
      <Button asChild size="lg" variant="outline">
        <a href="/" target="_blank" rel="noopener noreferrer">
          <ExternalLinkIcon aria-hidden /> View site
          <span className="sr-only">(opens in a new tab)</span>
        </a>
      </Button>
    </>
  );

  if (stats.total === 0) {
    return (
      <>
        <PageHeader title="Dashboard" />
        <EmptyState
          icon={<WatchIcon />}
          title="Your catalogue is empty"
          description="No watches have been added yet, so the shop shows no products. Import the 15 sample watches to get started quickly (you can edit or delete them later), or add your first watch yourself."
        >
          <SeedCatalogButton />
          <Button asChild size="lg">
            <Link href="/admin/watches/new">
              <PlusIcon aria-hidden /> Add your first watch
            </Link>
          </Button>
        </EmptyState>
      </>
    );
  }

  const cards = [
    { label: "Total watches", value: stats.total, href: "/admin/watches" },
    { label: "Published", value: stats.published, href: "/admin/watches?status=published" },
    { label: "Drafts", value: stats.drafts, href: "/admin/watches?status=draft" },
    { label: "Available", value: stats.available, hint: "In stock, limited or to order" },
    { label: "Sold out", value: stats.unavailable, href: "/admin/watches?availability=sold_out" },
    { label: "Featured", value: stats.featured },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your catalogue." actions={quickActions} />

      <section aria-label="Catalogue statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
        {cards.map((c) => {
          const body = (
            <>
              <p className="text-xs font-medium text-muted-foreground">{c.label}</p>
              <p className="mt-1 text-2xl font-semibold tabular-nums">{c.value}</p>
              {c.hint && <p className="mt-0.5 text-[11px] text-muted-foreground">{c.hint}</p>}
            </>
          );
          return c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className="rounded-lg border border-border bg-card p-4 outline-none transition-colors hover:border-foreground/40 focus-visible:ring-3 focus-visible:ring-ring/50"
            >
              {body}
            </Link>
          ) : (
            <div key={c.label} className="rounded-lg border border-border bg-card p-4">
              {body}
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="availability-heading" className="min-w-0 rounded-lg border border-border bg-card p-4 sm:p-5">
          <h2 id="availability-heading" className="font-sans text-base font-semibold tracking-normal">
            Availability
          </h2>
          <ul className="mt-4 flex flex-col gap-3">
            {AVAILABILITY.map((a) => {
              const n = stats.byAvailability[a] ?? 0;
              const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
              return (
                <li key={a}>
                  <Link
                    href={`/admin/watches?availability=${a}`}
                    className="group block rounded-md outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="flex items-center justify-between text-sm">
                      <span className="group-hover:text-foreground">{availabilityLabels[a]}</span>
                      <span className="tabular-nums text-muted-foreground">
                        {n} <span className="text-xs">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className="h-full rounded-full bg-primary" style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="recent-heading" className="min-w-0 rounded-lg border border-border bg-card">
          <div className="flex items-center justify-between border-b border-border px-4 py-3 sm:px-5">
            <h2 id="recent-heading" className="font-sans text-base font-semibold tracking-normal">
              Recently added
            </h2>
            <Link href="/admin/watches" className="text-sm font-medium text-primary hover:underline">
              All watches
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {stats.recent.map((w) => (
              <li key={w.id} className="flex items-center gap-3 px-4 py-3 sm:px-5">
                <Thumb src={w.images[0]?.url} alt="" />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/watches/${w.id}`} className="block truncate text-sm font-medium hover:underline">
                    {w.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.brand} · {formatPrice(w.price, settings.general)} · added {formatDate(w.createdAt, settings.general.locale)}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1.5 sm:hidden">
                    <StatusBadge published={w.published} />
                    <AvailabilityBadge value={w.availability} />
                  </div>
                </div>
                <div className="hidden shrink-0 flex-wrap gap-1.5 sm:flex">
                  <StatusBadge published={w.published} />
                  <AvailabilityBadge value={w.availability} />
                </div>
                <Button asChild variant="ghost" size="icon-sm">
                  <Link href={`/admin/watches/${w.id}`} aria-label={`Edit ${w.name}`}>
                    <PencilIcon aria-hidden />
                  </Link>
                </Button>
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
