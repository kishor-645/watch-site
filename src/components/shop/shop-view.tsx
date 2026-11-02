"use client";

import { useCallback, useMemo } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { AnimatePresence, MotionConfig, motion } from "framer-motion";
import { SlidersHorizontal, Watch as WatchIcon, X } from "lucide-react";
import { ProductCard } from "@/components/product/product-card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { watches } from "@/data/watches";
import {
  categoryLabels,
  genderLabels,
  getBrands,
  getPriceBounds,
  movementLabels,
} from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Gender } from "@/lib/types";
import { FilterPanel, type OptionCounts } from "./filter-panel";
import {
  applyFilters,
  hasActiveFilters,
  parseFilters,
  roundBounds,
  serializeFilters,
  sortOptions,
  type ListFilterKey,
  type ShopFilters,
  type SortKey,
} from "./filters";

const EASE = [0.22, 1, 0.36, 1] as const;
// Grid sits beside a 256px sidebar from lg upwards.
const GRID_SIZES = "(min-width: 1280px) 20vw, (min-width: 1024px) 24vw, (min-width: 768px) 33vw, 50vw";

export function ShopView() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const brands = useMemo(() => getBrands(), []);
  const bounds = useMemo(() => roundBounds(getPriceBounds()), []);
  const filters = useMemo(() => parseFilters(searchParams, brands), [searchParams, brands]);
  const results = useMemo(() => applyFilters(watches, filters), [filters]);
  const counts = useMemo(() => countOptions(), []);
  const active = hasActiveFilters(filters);

  const update = useCallback(
    (patch: Partial<ShopFilters>) => {
      const next = { ...filters, ...patch };
      if (next.minPrice != null && next.minPrice <= bounds.min) next.minPrice = null;
      if (next.maxPrice != null && next.maxPrice >= bounds.max) next.maxPrice = null;
      const qs = serializeFilters(next);
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [filters, bounds, pathname, router],
  );

  const toggle = useCallback(
    (key: ListFilterKey, value: string) => {
      const current = filters[key] as string[];
      const next = current.includes(value)
        ? current.filter((v) => v !== value)
        : [...current, value];
      update({ [key]: next } as Partial<ShopFilters>);
    },
    [filters, update],
  );

  const setPrice = useCallback(
    ([min, max]: [number, number]) => update({ minPrice: min, maxPrice: max }),
    [update],
  );

  const clearAll = useCallback(
    () =>
      update({
        category: [],
        brand: [],
        gender: [],
        movement: [],
        minPrice: null,
        maxPrice: null,
      }),
    [update],
  );

  const chips = buildChips(filters);
  const activeCount = chips.length;

  const panel = (
    <FilterPanel
      filters={filters}
      brands={brands}
      counts={counts}
      bounds={bounds}
      onToggle={toggle}
      onPriceCommit={setPrice}
    />
  );

  return (
    <MotionConfig reducedMotion="user">
      <div className="flex gap-12 xl:gap-16">
        {/* Desktop sidebar */}
        <aside
          aria-label="Filters"
          className="no-scrollbar sticky top-28 hidden max-h-[calc(100vh-8rem)] w-64 shrink-0 self-start overflow-y-auto pb-10 lg:block"
        >
          <div className="mb-8 flex items-baseline justify-between">
            <h2 className="font-serif text-2xl font-light">Refine</h2>
            {active && (
              <button
                type="button"
                onClick={clearAll}
                className="rounded-sm text-[11px] uppercase tracking-[0.25em] text-muted-foreground underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
              >
                Clear all
              </button>
            )}
          </div>
          {panel}
        </aside>

        <div className="min-w-0 flex-1">
          {/* Toolbar */}
          <div className="flex flex-wrap items-center justify-between gap-4 border-b border-border pb-5">
            <p className="text-sm text-muted-foreground" aria-live="polite">
              <span className="font-medium tabular-nums text-foreground">{results.length}</span>{" "}
              {results.length === 1 ? "timepiece" : "timepieces"}
              {active && <span className="hidden sm:inline"> of {watches.length}</span>}
            </p>

            <div className="flex items-center gap-3">
              <Sheet>
                <SheetTrigger asChild>
                  <Button
                    variant="outline"
                    className="h-10 gap-2 border-border px-4 text-xs uppercase tracking-[0.2em] lg:hidden"
                  >
                    <SlidersHorizontal aria-hidden />
                    Filters
                    {activeCount > 0 && (
                      <span className="ml-1 grid size-5 place-items-center rounded-full bg-gold text-[10px] font-semibold tracking-normal text-primary-foreground">
                        {activeCount}
                      </span>
                    )}
                  </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-full max-w-sm gap-0 border-r border-border bg-background p-0">
                  <SheetHeader className="border-b border-border px-6 py-5">
                    <SheetTitle className="font-serif text-2xl font-light">Refine</SheetTitle>
                    <SheetDescription className="text-xs">
                      Filter the collection by style, maker and price.
                    </SheetDescription>
                  </SheetHeader>
                  <div className="flex-1 overflow-y-auto px-6 py-8">{panel}</div>
                  <SheetFooter className="flex-row gap-3 border-t border-border px-6 py-4">
                    <Button
                      variant="outline"
                      onClick={clearAll}
                      disabled={!active}
                      className="h-11 flex-1 text-xs uppercase tracking-[0.2em]"
                    >
                      Clear all
                    </Button>
                    <SheetClose asChild>
                      <Button className="h-11 flex-[1.4] text-xs uppercase tracking-[0.2em]">
                        Show {results.length}
                      </Button>
                    </SheetClose>
                  </SheetFooter>
                </SheetContent>
              </Sheet>

              <Select value={filters.sort} onValueChange={(v) => update({ sort: v as SortKey })}>
                <SelectTrigger
                  aria-label="Sort timepieces"
                  className="h-10! min-w-44 border-border bg-transparent px-4 text-sm"
                >
                  <span className="mr-1 hidden text-muted-foreground sm:inline">Sort:</span>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent position="popper" align="end" className="border border-border">
                  {sortOptions.map((o) => (
                    <SelectItem key={o.value} value={o.value} className="py-2">
                      {o.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Active filter chips */}
          <AnimatePresence initial={false}>
            {activeCount > 0 && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.3, ease: EASE }}
                className="overflow-hidden"
              >
                <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2 pt-5">
                  {chips.map((chip) => (
                    <li key={chip.id}>
                      <button
                        type="button"
                        onClick={() =>
                          chip.key === "price"
                            ? update({ minPrice: null, maxPrice: null })
                            : toggle(chip.key, chip.value)
                        }
                        aria-label={`Remove filter: ${chip.label}`}
                        className="group inline-flex items-center gap-2 rounded-full border border-gold/30 bg-gold/5 py-1.5 pl-3.5 pr-2.5 text-xs text-foreground/90 transition-colors hover:border-gold/60 hover:bg-gold/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                      >
                        {chip.label}
                        <X aria-hidden className="size-3 text-gold/70 group-hover:text-gold" />
                      </button>
                    </li>
                  ))}
                  <li>
                    <button
                      type="button"
                      onClick={clearAll}
                      className="ml-1 rounded-sm px-1 text-[11px] uppercase tracking-[0.25em] text-muted-foreground underline-offset-4 transition-colors hover:text-gold hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
                    >
                      Clear all
                    </button>
                  </li>
                </ul>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Results */}
          <div className="pt-8">
            {results.length > 0 ? (
              <motion.ul
                layout
                className="grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 md:grid-cols-3 md:gap-y-14 xl:grid-cols-4"
              >
                <AnimatePresence mode="popLayout" initial={false}>
                  {results.map((watch, i) => (
                    <motion.li
                      key={watch.id}
                      layout
                      initial={{ opacity: 0, y: 16 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.96 }}
                      transition={{ duration: 0.45, ease: EASE }}
                    >
                      <ProductCard watch={watch} priority={i < 4} sizes={GRID_SIZES} />
                    </motion.li>
                  ))}
                </AnimatePresence>
              </motion.ul>
            ) : (
              <EmptyState onReset={clearAll} />
            )}
          </div>
        </div>
      </div>
    </MotionConfig>
  );
}

function EmptyState({ onReset }: { onReset: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="flex flex-col items-center border border-border bg-card/40 px-6 py-20 text-center md:py-28"
    >
      <span className="grid size-16 place-items-center rounded-full border border-gold/30 text-gold">
        <WatchIcon aria-hidden className="size-6" strokeWidth={1.25} />
      </span>
      <p className="mt-8 text-[11px] uppercase tracking-[0.3em] text-gold">No matches</p>
      <h2 className="mt-3 font-serif text-3xl font-light md:text-4xl">
        Nothing quite fits that description
      </h2>
      <p className="mt-4 max-w-md text-sm leading-relaxed text-muted-foreground">
        Try loosening a filter or widening your price range. Our full collection is only a click
        away.
      </p>
      <Button
        onClick={onReset}
        className="mt-10 h-11 px-8 text-xs uppercase tracking-[0.25em]"
      >
        Reset filters
      </Button>
    </motion.div>
  );
}

type Chip =
  | { id: string; key: ListFilterKey; value: string; label: string }
  | { id: string; key: "price"; value: string; label: string };

function buildChips(f: ShopFilters): Chip[] {
  const chips: Chip[] = [
    ...f.category.map((v) => ({ id: `c-${v}`, key: "category" as const, value: v, label: categoryLabels[v] })),
    ...f.brand.map((v) => ({ id: `b-${v}`, key: "brand" as const, value: v, label: v })),
    ...f.gender.map((v) => ({ id: `g-${v}`, key: "gender" as const, value: v, label: genderLabels[v] })),
    ...f.movement.map((v) => ({ id: `m-${v}`, key: "movement" as const, value: v, label: movementLabels[v] })),
  ];
  if (f.minPrice != null || f.maxPrice != null) {
    const label =
      f.minPrice != null && f.maxPrice != null
        ? `${formatPrice(f.minPrice)} – ${formatPrice(f.maxPrice)}`
        : f.minPrice != null
          ? `From ${formatPrice(f.minPrice)}`
          : `Up to ${formatPrice(f.maxPrice as number)}`;
    chips.push({ id: "price", key: "price", value: "price", label });
  }
  return chips;
}

function countOptions(): OptionCounts {
  const counts: OptionCounts = { category: {}, brand: {}, gender: {}, movement: {} };
  const bump = (bucket: Record<string, number>, key: string) => {
    bucket[key] = (bucket[key] ?? 0) + 1;
  };
  for (const w of watches) {
    bump(counts.category, w.category);
    bump(counts.brand, w.brand);
    bump(counts.movement, w.movementType);
    // Mirrors the filter rule: unisex pieces also count towards "Men" and "Women".
    const genders: Gender[] = w.gender === "unisex" ? ["unisex", "men", "women"] : [w.gender];
    genders.forEach((g) => bump(counts.gender, g));
  }
  return counts;
}
