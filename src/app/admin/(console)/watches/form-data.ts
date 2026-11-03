import "server-only";
import type { WatchFormProps } from "@/components/admin/watch-form";
import { loadSettings } from "@/server/queries/settings";
import { getCatalogFacets } from "@/server/queries/watches";

/** Shared server-side props for the new/edit watch pages. */
export async function loadWatchFormData(): Promise<Omit<WatchFormProps, "watch">> {
  const [settings, facets] = await Promise.all([
    loadSettings(),
    getCatalogFacets().catch(() => ({ brands: [] as { label: string }[] })),
  ]);
  return {
    categories: settings.catalog.categories.map(({ slug, label }) => ({ slug, label })),
    movements: settings.catalog.movements.map(({ slug, label }) => ({ slug, label })),
    brands: facets.brands.map((b) => b.label),
    currency: { currencyCode: settings.general.currencyCode, locale: settings.general.locale },
  };
}
