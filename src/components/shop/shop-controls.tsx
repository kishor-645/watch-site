"use client";

import { useState } from "react";
import { Search, SlidersHorizontal, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
import { formatPrice } from "@/lib/format";
import { SORT_OPTIONS } from "@/lib/schemas/catalog-query";
import type { CatalogQuery, SortKey } from "@/lib/types";
import { FilterPanel } from "./filter-panel";
import { useShop } from "./shop-state";
import { EMPTY_FILTERS, hasActiveFilters, type ListKey, type ShopOptions } from "./types";

export function ShopSearch() {
  const { query, navigate } = useShop();
  return (
    <form
      role="search"
      className="relative w-full sm:max-w-sm"
      onSubmit={(e) => {
        e.preventDefault();
        const q = String(new FormData(e.currentTarget).get("q") ?? "").trim();
        navigate({ q });
      }}
    >
      <label htmlFor="shop-search" className="sr-only">
        Search watches
      </label>
      <input
        // Re-sync the uncontrolled input when the query changes via chips / clear all.
        key={query.q}
        id="shop-search"
        name="q"
        type="search"
        defaultValue={query.q}
        placeholder="Search by name, brand or reference"
        maxLength={80}
        className="h-11 w-full rounded-full border border-transparent bg-background/60 pl-11 pr-4 text-sm text-foreground transition-[border-color] duration-300 placeholder:text-muted-foreground hover:border-foreground/15 focus:border-ring"
      />
      <Search aria-hidden className="pointer-events-none absolute left-4 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </form>
  );
}

export function SortSelect() {
  const { query, navigate } = useShop();
  return (
    <Select value={query.sort} onValueChange={(v) => navigate({ sort: v as SortKey })}>
      <SelectTrigger aria-label="Sort watches" className="h-11! min-w-48 flex-1 rounded-full border-foreground/[0.1] bg-background/60 px-4 text-sm text-foreground hover:border-foreground/25 sm:flex-none">
        <span className="mr-1 hidden text-muted-foreground sm:inline">Sort:</span>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="end" className="rounded-2xl border border-border">
        {SORT_OPTIONS.map((o) => (
          <SelectItem key={o.value} value={o.value} className="rounded-lg py-2">
            {o.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

export function MobileFilters({ options, total }: { options: ShopOptions; total: number }) {
  const { query, navigate, pending } = useShop();
  const [open, setOpen] = useState(false);
  const count = buildChips(query, options).length;

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" className="type-nav h-11 gap-2 rounded-full border-foreground/[0.1] bg-background/60 px-4 text-xs font-semibold lg:hidden">
          <SlidersHorizontal aria-hidden />
          Filters
          {count > 0 && (
            <span className="ml-1 grid size-5 place-items-center rounded-full bg-primary text-[10px] font-semibold tracking-normal text-primary-foreground">
              {count}
              <span className="sr-only"> active</span>
            </span>
          )}
        </Button>
      </SheetTrigger>
      <SheetContent side="left" className="w-full max-w-sm gap-0 border-r border-border bg-background p-0">
        <SheetHeader className="border-b border-border px-6 py-5">
          <SheetTitle className="font-display text-2xl font-bold tracking-[-0.02em]">Filters</SheetTitle>
          <SheetDescription className="text-xs">Results update as you choose.</SheetDescription>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto px-6 py-8">
          <FilterPanel options={options} />
        </div>
        <SheetFooter className="flex-row gap-3 border-t border-border px-6 py-4">
          <Button
            variant="outline"
            onClick={() => navigate(EMPTY_FILTERS)}
            disabled={!hasActiveFilters(query)}
            className="type-nav h-12 flex-1 rounded-full border-foreground/30 bg-transparent text-xs font-semibold"
          >
            Clear all
          </Button>
          <SheetClose asChild>
            <Button className="type-nav h-12 flex-[1.4] rounded-full text-xs font-semibold hover:bg-[color-mix(in_oklab,var(--primary),white_14%)]" aria-live="polite">
              {pending ? "Updating…" : `Show ${total} ${total === 1 ? "watch" : "watches"}`}
            </Button>
          </SheetClose>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}

type Chip = { id: string; label: string; patch: Partial<CatalogQuery> };

function buildChips(q: CatalogQuery, o: ShopOptions): Chip[] {
  const label = (list: ShopOptions["categories"], slug: string) => list.find((x) => x.slug === slug)?.label ?? slug;
  const list = (key: ListKey, options: ShopOptions["categories"]): Chip[] =>
    (q[key] as string[]).map((v) => ({
      id: `${key}-${v}`,
      label: label(options, v),
      patch: { [key]: (q[key] as string[]).filter((x) => x !== v) } as Partial<CatalogQuery>,
    }));

  const chips: Chip[] = [
    ...(q.q ? [{ id: "q", label: `“${q.q}”`, patch: { q: "" } }] : []),
    ...list("category", o.categories),
    ...list("brand", o.brands),
    ...list("gender", o.genders),
    ...list("movement", o.movements),
    ...(q.inStock ? [{ id: "stock", label: "Available only", patch: { inStock: false } }] : []),
  ];
  if (q.minPrice != null || q.maxPrice != null) {
    const f = (v: number) => formatPrice(v, o.currency);
    chips.push({
      id: "price",
      label:
        q.minPrice != null && q.maxPrice != null
          ? `${f(q.minPrice)} – ${f(q.maxPrice)}`
          : q.minPrice != null
            ? `From ${f(q.minPrice)}`
            : `Up to ${f(q.maxPrice!)}`,
      patch: { minPrice: null, maxPrice: null },
    });
  }
  return chips;
}

export function ActiveFilters({ options }: { options: ShopOptions }) {
  const { query, navigate } = useShop();
  const chips = buildChips(query, options);
  if (!chips.length) return null;
  return (
    <ul aria-label="Active filters" className="flex flex-wrap items-center gap-2 pt-5">
      {chips.map((chip) => (
        <li key={chip.id}>
          <button
            type="button"
            onClick={() => navigate(chip.patch)}
            aria-label={`Remove filter: ${chip.label}`}
            className="group inline-flex h-8 items-center gap-2 rounded-full border border-brand/40 bg-brand/15 pl-3.5 pr-2.5 text-[0.8125rem] font-medium text-foreground transition-colors duration-150 hover:border-brand-ink hover:bg-brand/25"
          >
            {chip.label}
            <X aria-hidden className="size-3.5 text-muted-foreground group-hover:text-foreground" />
          </button>
        </li>
      ))}
      <li>
        <button
          type="button"
          onClick={() => navigate(EMPTY_FILTERS)}
          className="ml-1 rounded-sm px-1 text-[0.8125rem] font-medium text-brand-ink underline decoration-brand-ink/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-brand-ink"
        >
          Clear all
        </button>
      </li>
    </ul>
  );
}

/** "Clear all" link in the desktop sidebar header. */
export function ClearAllButton() {
  const { query, navigate } = useShop();
  if (!hasActiveFilters(query)) return null;
  return (
    <button
      type="button"
      onClick={() => navigate(EMPTY_FILTERS)}
      className="rounded-sm text-[0.8125rem] font-medium text-brand-ink underline decoration-brand-ink/40 underline-offset-[6px] transition-colors duration-150 hover:decoration-brand-ink"
    >
      Clear all
    </button>
  );
}
