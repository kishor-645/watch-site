import type { Metadata } from "next";
import Link from "next/link";
import { PlusIcon, SearchXIcon, WatchIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { EmptyState, PageHeader, Pagination } from "@/components/admin/page-parts";
import { SeedCatalogButton } from "@/components/admin/seed-catalog-button";
import { WatchesList } from "@/components/admin/watches-list";
import { WatchesToolbar } from "@/components/admin/watches-toolbar";
import { adminWatchQuerySchema, type AdminWatchQuery } from "@/lib/schemas/admin-query";
import { requireAdminPage } from "@/server/auth/session";
import { listAdminWatches } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Watches",
  robots: { index: false, follow: false },
};

type SearchParams = Promise<Record<string, string | string[] | undefined>>;

function parseQuery(raw: Record<string, string | string[] | undefined>): AdminWatchQuery {
  const first = (v: string | string[] | undefined) => (Array.isArray(v) ? v[0] : v);
  const input = {
    q: first(raw.q),
    status: first(raw.status),
    availability: first(raw.availability),
    page: first(raw.page),
  };
  const parsed = adminWatchQuerySchema.safeParse(input);
  if (parsed.success) return parsed.data;
  // Drop only the invalid keys instead of failing the whole page.
  const bad = new Set(parsed.error.issues.map((i) => String(i.path[0])));
  const cleaned = Object.fromEntries(Object.entries(input).filter(([k]) => !bad.has(k)));
  return adminWatchQuerySchema.parse(cleaned);
}

export default async function WatchesPage({ searchParams }: { searchParams: SearchParams }) {
  await requireAdminPage();
  const query = parseQuery(await searchParams);
  const [result, settings] = await Promise.all([listAdminWatches(query), loadSettings()]);
  const filtered = Boolean(query.q) || query.status !== "all" || query.availability !== "all";

  return (
    <>
      <PageHeader
        title="Watches"
        description="Edit prices, availability and visibility directly in the list, or open a watch for full details."
        actions={
          <Button asChild size="lg">
            <Link href="/admin/watches/new">
              <PlusIcon aria-hidden /> Add watch
            </Link>
          </Button>
        }
      />

      {result.total === 0 && !filtered ? (
        <EmptyState
          icon={<WatchIcon />}
          title="No watches yet"
          description="Add your first watch, or import the 15 sample watches to see how the shop looks."
        >
          <SeedCatalogButton />
          <Button asChild size="lg">
            <Link href="/admin/watches/new">
              <PlusIcon aria-hidden /> Add your first watch
            </Link>
          </Button>
        </EmptyState>
      ) : (
        <>
          <WatchesToolbar initial={{ q: query.q, status: query.status, availability: query.availability }} />
          {result.items.length === 0 ? (
            <EmptyState
              icon={<SearchXIcon />}
              title="No watches match"
              description="Try a different search term or clear the filters."
            >
              <Button asChild variant="outline">
                <Link href="/admin/watches">Clear filters</Link>
              </Button>
            </EmptyState>
          ) : (
            <WatchesList
              watches={result.items}
              currency={{ currencyCode: settings.general.currencyCode, locale: settings.general.locale }}
            />
          )}
          <Pagination
            basePath="/admin/watches"
            params={{
              q: query.q || undefined,
              status: query.status !== "all" ? query.status : undefined,
              availability: query.availability !== "all" ? query.availability : undefined,
            }}
            page={result.page}
            pageCount={result.pageCount}
            total={result.total}
            pageSize={result.pageSize}
            noun="watches"
          />
        </>
      )}
    </>
  );
}
