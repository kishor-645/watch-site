import type { Metadata } from "next";
import { PageHeader } from "@/components/admin/page-parts";
import { SettingsForm } from "@/components/admin/settings-form";
import { formatDateTime } from "@/lib/format";
import { getSiteUrl } from "@/lib/site-url";
import { requireAdminPage } from "@/server/auth/session";
import { listAdminWatches } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Settings",
  robots: { index: false, follow: false },
};

export default async function SettingsPage() {
  await requireAdminPage();
  const [settings, published] = await Promise.all([
    loadSettings(),
    listAdminWatches({ q: "", status: "published", availability: "all", page: 1, pageSize: 100 }),
  ]);
  const items = [...published.items];
  const heroSlug = settings.home.heroWatchSlug;
  if (heroSlug && !items.some((w) => w.slug === heroSlug)) {
    // Keep the saved hero selectable even when it falls outside the first page of results.
    const found = await listAdminWatches({ q: heroSlug, status: "all", availability: "all", page: 1, pageSize: 5 });
    const hero = found.items.find((w) => w.slug === heroSlug);
    if (hero) items.push(hero);
  }
  const watches = items
    .map((w) => ({ slug: w.slug, name: w.name, brand: w.brand, modelNumber: w.modelNumber, price: w.price }))
    .sort((a, b) => `${a.brand} ${a.name}`.localeCompare(`${b.brand} ${b.name}`));

  return (
    <>
      <PageHeader
        title="Settings"
        description={
          settings.updatedAt
            ? `Changes appear on the website as soon as you save. Last saved ${formatDateTime(settings.updatedAt, settings.general.locale)}.`
            : "Changes appear on the website as soon as you save. Defaults are in use until the first save."
        }
      />
      {settings.invalidSections.length > 0 && (
        <div role="alert" className="mb-6 rounded-lg border border-destructive/40 bg-destructive/10 p-4 text-sm">
          <p className="font-medium text-foreground">Some saved settings were invalid and have been reset to defaults</p>
          <p className="mt-1 text-muted-foreground">
            Affected sections: {settings.invalidSections.join(", ")}. Review them below and save to fix.
          </p>
        </div>
      )}
      <SettingsForm settings={settings} watches={watches} siteUrl={getSiteUrl()} />
    </>
  );
}
