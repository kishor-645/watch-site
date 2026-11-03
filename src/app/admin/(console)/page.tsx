import type { Metadata } from "next";
import Link from "next/link";
import {
  ArrowRightIcon,
  ExternalLinkIcon,
  EyeIcon,
  FilePenLineIcon,
  type LucideIcon,
  PackageCheckIcon,
  PackageXIcon,
  PencilIcon,
  PlusIcon,
  SettingsIcon,
  SparklesIcon,
  WatchIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { AvailabilityBadge, EmptyState, PageHeader, StatusBadge, Thumb } from "@/components/admin/page-parts";
import { SeedCatalogButton } from "@/components/admin/seed-catalog-button";
import { formatDate, formatPrice } from "@/lib/format";
import { AVAILABILITY, availabilityLabels, type Availability } from "@/lib/schemas/watch";
import { requireAdminPage } from "@/server/auth/session";
import { getDashboardStats } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Dashboard",
  robots: { index: false, follow: false },
};

const CARD = "rounded-xl border border-border bg-card shadow-[0_1px_2px_rgb(10_14_28/0.04)]";

const barTone: Record<Availability, string> = {
  in_stock: "bg-success",
  limited: "bg-warning",
  pre_order: "bg-info",
  sold_out: "bg-foreground/30",
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

  const cards: { label: string; value: number; href?: string; hint?: string; icon: LucideIcon; tone: string }[] = [
    { label: "Total watches", value: stats.total, href: "/admin/watches", icon: WatchIcon, tone: "bg-brand/10 text-brand-ink" },
    {
      label: "Published",
      value: stats.published,
      href: "/admin/watches?status=published",
      icon: EyeIcon,
      tone: "bg-success/10 text-success",
    },
    { label: "Drafts", value: stats.drafts, href: "/admin/watches?status=draft", icon: FilePenLineIcon, tone: "bg-violet/10 text-violet" },
    {
      label: "Available",
      value: stats.available,
      hint: "In stock, limited or to order",
      icon: PackageCheckIcon,
      tone: "bg-info/10 text-info",
    },
    {
      label: "Sold out",
      value: stats.unavailable,
      href: "/admin/watches?availability=sold_out",
      icon: PackageXIcon,
      tone: "bg-hot/10 text-hot-ink",
    },
    { label: "Featured", value: stats.featured, icon: SparklesIcon, tone: "bg-warning/10 text-warning" },
  ];

  return (
    <>
      <PageHeader title="Dashboard" description="An overview of your catalogue." actions={quickActions} />

      <section aria-label="Catalogue statistics" className="grid grid-cols-2 gap-3 sm:grid-cols-3 xl:grid-cols-6">
        {cards.map((c) => {
          const Icon = c.icon;
          const body = (
            <>
              <span
                aria-hidden
                className="absolute inset-x-0 top-0 h-0.5 bg-aurora opacity-60 transition-opacity group-hover:opacity-100"
              />
              <span aria-hidden className={`mb-2 grid size-7 place-items-center rounded-lg sm:mb-3 sm:size-8 ${c.tone}`}>
                <Icon className="size-4" />
              </span>
              <span className="block truncate text-xs font-medium text-muted-foreground">{c.label}</span>
              <span className="admin-display mt-0.5 block text-2xl leading-tight font-semibold tabular-nums">{c.value}</span>
              {c.hint && <span className="mt-0.5 block text-[11px] leading-snug text-muted-foreground">{c.hint}</span>}
            </>
          );
          const cardClass = `group relative min-w-0 overflow-hidden p-3 sm:p-4 ${CARD}`;
          return c.href ? (
            <Link
              key={c.label}
              href={c.href}
              className={`${cardClass} outline-none transition-[border-color,box-shadow] hover:border-foreground/20 hover:shadow-md focus-visible:ring-3 focus-visible:ring-ring/50`}
            >
              {body}
            </Link>
          ) : (
            <div key={c.label} className={cardClass}>
              {body}
            </div>
          );
        })}
      </section>

      <div className="mt-6 grid grid-cols-1 gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,2fr)]">
        <section aria-labelledby="availability-heading" className={`min-w-0 p-4 sm:p-5 ${CARD}`}>
          <div className="flex items-baseline justify-between gap-2">
            <h2 id="availability-heading" className="text-base font-semibold">
              Availability
            </h2>
            <span className="text-xs text-muted-foreground tabular-nums">{stats.total} watches</span>
          </div>
          {/* Stacked overview bar */}
          <div className="mt-4 flex h-2 gap-px overflow-hidden rounded-full bg-muted" aria-hidden>
            {AVAILABILITY.map((a) => {
              const n = stats.byAvailability[a] ?? 0;
              return n ? <div key={a} className={barTone[a]} style={{ width: `${(n / stats.total) * 100}%` }} /> : null;
            })}
          </div>
          <ul className="mt-3 flex flex-col">
            {AVAILABILITY.map((a) => {
              const n = stats.byAvailability[a] ?? 0;
              const pct = stats.total ? Math.round((n / stats.total) * 100) : 0;
              return (
                <li key={a}>
                  <Link
                    href={`/admin/watches?availability=${a}`}
                    className="-mx-2 block rounded-lg px-2 py-2 outline-none transition-colors hover:bg-muted/60 focus-visible:ring-3 focus-visible:ring-ring/50"
                  >
                    <div className="flex items-center justify-between gap-2 text-sm">
                      <span className="flex min-w-0 items-center gap-2">
                        <span aria-hidden className={`size-2 shrink-0 rounded-full ${barTone[a]}`} />
                        <span className="truncate">{availabilityLabels[a]}</span>
                      </span>
                      <span className="shrink-0 font-medium tabular-nums">
                        {n} <span className="text-xs font-normal text-muted-foreground">({pct}%)</span>
                      </span>
                    </div>
                    <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-muted" aria-hidden>
                      <div className={`h-full rounded-full ${barTone[a]}`} style={{ width: `${pct}%` }} />
                    </div>
                  </Link>
                </li>
              );
            })}
          </ul>
        </section>

        <section aria-labelledby="recent-heading" className={`min-w-0 overflow-hidden ${CARD}`}>
          <div className="flex items-center justify-between gap-2 border-b border-border px-4 py-3 sm:px-5">
            <h2 id="recent-heading" className="text-base font-semibold">
              Recently added
            </h2>
            <Link
              href="/admin/watches"
              className="inline-flex shrink-0 items-center gap-1 rounded-md text-sm font-medium text-brand-ink outline-none hover:underline focus-visible:ring-2 focus-visible:ring-ring"
            >
              All watches <ArrowRightIcon className="size-3.5" aria-hidden />
            </Link>
          </div>
          <ul className="divide-y divide-border">
            {stats.recent.map((w) => (
              <li key={w.id} className="flex min-w-0 items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40 sm:px-5">
                <Thumb src={w.images[0]?.url} alt="" size={44} />
                <div className="min-w-0 flex-1">
                  <Link href={`/admin/watches/${w.id}`} className="block truncate text-sm font-medium hover:underline">
                    {w.name}
                  </Link>
                  <p className="truncate text-xs text-muted-foreground">
                    {w.brand} · {formatPrice(w.price, settings.general)} · added{" "}
                    {formatDate(w.createdAt, settings.general.locale)}
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
                <Button asChild variant="ghost" size="icon-sm" className="shrink-0">
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
