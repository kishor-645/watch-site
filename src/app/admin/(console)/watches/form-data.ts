import "server-only";
import type { WatchFormProps } from "@/components/admin/watch-form";
import { listAllBrands } from "@/server/queries/admin";
import { loadSettings } from "@/server/queries/settings";

/** Shared server-side props for the new/edit watch pages. */
export async function loadWatchFormData(): Promise<Omit<WatchFormProps, "watch">> {
  const [settings, brands] = await Promise.all([loadSettings(), listAllBrands()]);
  return {
    categories: settings.catalog.categories.map(({ slug, label }) => ({ slug, label })),
    movements: settings.catalog.movements.map(({ slug, label }) => ({ slug, label })),
    brands,
    currency: { currencyCode: settings.general.currencyCode, locale: settings.general.locale },
  };
}
