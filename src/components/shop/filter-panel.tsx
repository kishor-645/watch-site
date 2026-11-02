"use client";

import { useEffect, useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { categoryLabels, genderLabels, movementLabels } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import {
  categoryOptions,
  genderOptions,
  movementOptions,
  type ListFilterKey,
  type ShopFilters,
} from "./filters";

export type OptionCounts = Record<ListFilterKey, Record<string, number>>;

interface FilterPanelProps {
  filters: ShopFilters;
  brands: string[];
  counts: OptionCounts;
  bounds: { min: number; max: number };
  onToggle: (key: ListFilterKey, value: string) => void;
  onPriceCommit: (range: [number, number]) => void;
}

export function FilterPanel({
  filters,
  brands,
  counts,
  bounds,
  onToggle,
  onPriceCommit,
}: FilterPanelProps) {
  return (
    <div className="space-y-9">
      <CheckboxGroup
        legend="Category"
        name="category"
        options={categoryOptions.map((v) => ({ value: v, label: categoryLabels[v] }))}
        selected={filters.category}
        counts={counts.category}
        onToggle={(v) => onToggle("category", v)}
      />
      <PriceRange
        bounds={bounds}
        min={filters.minPrice}
        max={filters.maxPrice}
        onCommit={onPriceCommit}
      />
      <CheckboxGroup
        legend="Brand"
        name="brand"
        options={brands.map((b) => ({ value: b, label: b }))}
        selected={filters.brand}
        counts={counts.brand}
        onToggle={(v) => onToggle("brand", v)}
      />
      <CheckboxGroup
        legend="Gender"
        name="gender"
        options={genderOptions.map((v) => ({ value: v, label: genderLabels[v] }))}
        selected={filters.gender}
        counts={counts.gender}
        onToggle={(v) => onToggle("gender", v)}
      />
      <CheckboxGroup
        legend="Movement"
        name="movement"
        options={movementOptions.map((v) => ({ value: v, label: movementLabels[v] }))}
        selected={filters.movement}
        counts={counts.movement}
        onToggle={(v) => onToggle("movement", v)}
      />
    </div>
  );
}

function GroupLegend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="mb-4 flex w-full items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
      {children}
      <span aria-hidden className="h-px flex-1 bg-gradient-to-r from-gold/30 to-transparent" />
    </legend>
  );
}

function CheckboxGroup({
  legend,
  name,
  options,
  selected,
  counts,
  onToggle,
}: {
  legend: string;
  name: string;
  options: { value: string; label: string }[];
  selected: readonly string[];
  counts: Record<string, number>;
  onToggle: (value: string) => void;
}) {
  const uid = useId();
  if (!options.length) return null;
  return (
    <fieldset>
      <GroupLegend>{legend}</GroupLegend>
      <ul className="space-y-3">
        {options.map((opt) => {
          const id = `${uid}-${name}-${opt.value}`;
          const checked = selected.includes(opt.value);
          const count = counts[opt.value] ?? 0;
          return (
            <li key={opt.value} className="flex items-center gap-3">
              <Checkbox
                id={id}
                checked={checked}
                onCheckedChange={() => onToggle(opt.value)}
                className="border-foreground/25"
              />
              <label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-sm text-foreground/80 transition-colors hover:text-foreground peer-data-checked:text-foreground"
              >
                <span>{opt.label}</span>
                <span className="text-xs tabular-nums text-muted-foreground">{count}</span>
              </label>
            </li>
          );
        })}
      </ul>
    </fieldset>
  );
}

function PriceRange({
  bounds,
  min,
  max,
  onCommit,
}: {
  bounds: { min: number; max: number };
  min: number | null;
  max: number | null;
  onCommit: (range: [number, number]) => void;
}) {
  const committed: [number, number] = [
    Math.max(bounds.min, min ?? bounds.min),
    Math.min(bounds.max, max ?? bounds.max),
  ];
  const [range, setRange] = useState<[number, number]>(committed);

  // Keep the local slider in sync when filters change elsewhere (chips, "Clear all", URL).
  const [cMin, cMax] = committed;
  useEffect(() => {
    setRange([cMin, cMax]);
  }, [cMin, cMax]);

  return (
    <fieldset>
      <GroupLegend>Price</GroupLegend>
      <div className="mb-5 flex items-center justify-between text-sm tabular-nums">
        <span className="text-foreground/90">{formatPrice(range[0])}</span>
        <span aria-hidden className="mx-3 h-px flex-1 bg-border" />
        <span className="text-foreground/90">{formatPrice(range[1])}</span>
      </div>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={1000}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]])}
        onValueCommit={(v) => onCommit([v[0], v[1]])}
        className="py-2 [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-gold [&_[data-slot=slider-thumb]]:bg-background"
        thumbLabels={["Minimum price", "Maximum price"]}
      />
    </fieldset>
  );
}
