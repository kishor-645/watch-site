import type { Metadata } from "next";
import { container } from "@/components/home/section-heading";
import { ProductCard } from "@/components/product/product-card";
import { FilterPanel } from "@/components/shop/filter-panel";
import { PageHeader } from "@/components/shop/page-header";
import { Pagination } from "@/components/shop/pagination";
import { ActiveFilters, ClearAllButton, MobileFilters, ShopSearch, SortSelect } from "@/components/shop/shop-controls";
import { ShopEmpty } from "@/components/shop/shop-empty";
import { PendingRegion, ShopStateProvider } from "@/components/shop/shop-state";
import { hasActiveFilters, sliderBounds, type ShopOptions } from "@/components/shop/types";
import { parseCatalogQuery } from "@/lib/schemas/catalog-query";
import { GENDERS, genderLabels } from "@/lib/schemas/watch";
import type { CatalogQuery, PublicSettings } from "@/lib/types";
import { generalEnquiryUrl } from "@/lib/whatsapp";
import { getSiteSettings } from "@/server/queries/settings";
import { getCatalogFacets, listPublishedWatches } from "@/server/queries/watches";

type Props = { searchParams: Promise<Record<string, string | string[] | undefined>> };

// Grid sits beside a 256px sidebar from lg upwards: 2 cols < md, 3 cols >= md.
const GRID_SIZES = "(min-width: 1280px) 300px, (min-width: 1024px) 28vw, (min-width: 768px) 30vw, 50vw";

/** The single category being browsed (e.g. /shop?category=diver), if that is the only filter. */
function activeCategory(query: CatalogQuery, settings: PublicSettings) {
  if (query.category.length !== 1) return null;
  return settings.catalog.categories.find((c) => c.slug === query.category[0]) ?? null;
}

function isPlainCategoryView(query: CatalogQuery): boolean {
  return (
    !query.q &&
    !query.brand.length &&
    !query.gender.length &&
    !query.movement.length &&
    !query.inStock &&
    query.minPrice == null &&
    query.maxPrice == null &&
    query.category.length <= 1
  );
}

export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const [query, settings] = await Promise.all([searchParams.then(parseCatalogQuery), getSiteSettings()]);
  const category = activeCategory(query, settings);
  const indexable = isPlainCategoryView(query);
  const title = category ? `${category.label} watches` : query.q ? `Search: ${query.q}` : "Shop watches";
  const description =
    category?.description ||
    `Browse ${category ? `${category.label.toLowerCase()} watches` : "the full collection"} at ${settings.general.siteName}. Check availability instantly on WhatsApp.`;
  const canonical = category && indexable ? `/shop?category=${encodeURIComponent(category.slug)}` : "/shop";
  return {
    title,
    description,
    alternates: { canonical },
    robots: indexable ? undefined : { index: false, follow: true },
    openGraph: { title, description, url: canonical },
  };
}

export default async function ShopPage({ searchParams }: Props) {
  const query = parseCatalogQuery(await searchParams);
  const [settings, result, facets] = await Promise.all([
    getSiteSettings(),
    listPublishedWatches(query),
    getCatalogFacets(),
  ]);

  const options: ShopOptions = {
    categories: settings.catalog.categories.map(({ slug, label }) => ({ slug, label })),
    brands: facets.brands,
    movements: settings.catalog.movements,
    genders: GENDERS.map((g) => ({ slug: g, label: genderLabels[g] })),
    bounds: sliderBounds(facets.priceBounds),
    currency: { currencyCode: settings.general.currencyCode, locale: settings.general.locale },
  };
  const category = activeCategory(query, settings);
  const filtered = hasActiveFilters(query);
  const whatsappHref = generalEnquiryUrl(settings);
  const first = (result.page - 1) * result.pageSize + 1;
  const last = first + result.items.length - 1;

  return (
    <>
      <PageHeader
        crumbs={[
          { label: "Home", href: "/" },
          ...(category ? [{ label: "Shop", href: "/shop" }, { label: category.label }] : [{ label: "Shop" }]),
        ]}
        eyebrow={category ? "Category" : "The collection"}
        title={category ? `${category.label} watches` : "Shop watches"}
        description={
          category?.description ||
          "Filter by category, brand, movement or price. Found something you like? Check its availability instantly on WhatsApp."
        }
      />

      <ShopStateProvider query={query}>
        <div className={`${container} flex gap-12 pt-8 md:pt-12 xl:gap-16`}>
          <aside
            aria-label="Filters"
            className="no-scrollbar sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 self-start overflow-y-auto pb-10 lg:block"
          >
            <div className="mb-8 flex items-baseline justify-between">
              <h2 className="font-serif text-2xl font-light">Filters</h2>
              <ClearAllButton />
            </div>
            <FilterPanel options={options} />
          </aside>

          <div className="min-w-0 flex-1">
            <div className="flex flex-col gap-4 border-b border-border pb-5 sm:flex-row sm:items-center sm:justify-between">
              <ShopSearch />
              <div className="flex items-center gap-3">
                <MobileFilters options={options} total={result.total} />
                <SortSelect />
              </div>
            </div>

            <ActiveFilters options={options} />

            <PendingRegion className="pt-6">
              <p className="mb-6 text-sm text-muted-foreground" role="status">
                {result.total > 0 ? (
                  <>
                    Showing{" "}
                    <span className="tabular-nums text-foreground">
                      {result.pageCount > 1 ? `${first}–${last} of ${result.total}` : result.total}
                    </span>{" "}
                    {result.total === 1 ? "watch" : "watches"}
                  </>
                ) : (
                  "No watches found"
                )}
              </p>

              {result.items.length > 0 ? (
                <ul className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 md:gap-y-14">
                  {result.items.map((watch, i) => (
                    <li key={watch.id}>
                      <ProductCard
                        watch={watch}
                        currency={options.currency}
                        priority={i === 0}
                        sizes={GRID_SIZES}
                        headingLevel="h2"
                      />
                    </li>
                  ))}
                </ul>
              ) : (
                <ShopEmpty filtered={filtered} whatsappHref={whatsappHref} />
              )}

              <Pagination query={query} page={result.page} pageCount={result.pageCount} />
            </PendingRegion>
          </div>
        </div>
      </ShopStateProvider>
    </>
  );
}
