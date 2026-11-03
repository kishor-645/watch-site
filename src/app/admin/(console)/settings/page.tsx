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
  const watches = published.items
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
      <SettingsForm settings={settings} watches={watches} siteUrl={getSiteUrl()} />
    </>
  );
}
