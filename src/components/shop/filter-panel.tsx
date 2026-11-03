"use client";

import { useId, useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Slider } from "@/components/ui/slider";
import { formatPrice, type CurrencyOptions } from "@/lib/format";
import type { CatalogQuery } from "@/lib/types";
import { useShop } from "./shop-state";
import type { ListKey, Option, ShopOptions } from "./types";

export function FilterPanel({ options }: { options: ShopOptions }) {
  const { query, navigate } = useShop();

  const toggle = (key: ListKey, value: string) => {
    const current = query[key] as string[];
    const next = current.includes(value) ? current.filter((v) => v !== value) : [...current, value];
    navigate({ [key]: next } as Partial<CatalogQuery>);
  };

  return (
    <div className="divide-y divide-border [&>*]:py-6 [&>*:first-child]:pt-0">
      <StockToggle checked={query.inStock} onChange={(inStock) => navigate({ inStock })} />
      <CheckboxGroup
        legend="Category"
        options={options.categories}
        selected={query.category}
        onToggle={(v) => toggle("category", v)}
      />
      {options.bounds && (
        <PriceRange
          // Remount when the committed range changes elsewhere (chips, clear all, back button).
          key={`${query.minPrice ?? ""}-${query.maxPrice ?? ""}`}
          bounds={options.bounds}
          currency={options.currency}
          min={query.minPrice}
          max={query.maxPrice}
          onCommit={([min, max]) =>
            navigate({
              minPrice: min <= options.bounds!.min ? null : min,
              maxPrice: max >= options.bounds!.max ? null : max,
            })
          }
        />
      )}
      <CheckboxGroup legend="Brand" options={options.brands} selected={query.brand} onToggle={(v) => toggle("brand", v)} />
      <CheckboxGroup legend="Gender" options={options.genders} selected={query.gender} onToggle={(v) => toggle("gender", v)} />
      <CheckboxGroup
        legend="Movement"
        options={options.movements}
        selected={query.movement}
        onToggle={(v) => toggle("movement", v)}
      />
    </div>
  );
}

/** 16px, 2px radius, `border-input`; checked = ink fill with an ivory tick (from the primitive). */
const checkboxClass = "rounded-sm border-input";

function GroupLegend({ children }: { children: React.ReactNode }) {
  return (
    <legend className="eyebrow float-left mb-4 w-full text-muted-foreground">
      {children}
    </legend>
  );
}

function StockToggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  const id = useId();
  return (
    <div className="flex items-center gap-3">
      <Checkbox id={id} checked={checked} onCheckedChange={(v) => onChange(v === true)} className={checkboxClass} />
      <label htmlFor={id} className="cursor-pointer text-sm text-foreground">
        Available only <span className="text-muted-foreground">(hide sold out)</span>
      </label>
    </div>
  );
}

function CheckboxGroup({
  legend,
  options,
  selected,
  onToggle,
}: {
  legend: string;
  options: Option[];
  selected: readonly string[];
  onToggle: (value: string) => void;
}) {
  const uid = useId();
  if (!options.length) return null;
  return (
    <fieldset>
      <GroupLegend>{legend}</GroupLegend>
      <ul className="clear-left space-y-3">
        {options.map((opt) => {
          const id = `${uid}-${opt.slug}`;
          return (
            <li key={opt.slug} className="flex items-center gap-3">
              <Checkbox
                id={id}
                checked={selected.includes(opt.slug)}
                onCheckedChange={() => onToggle(opt.slug)}
                className={checkboxClass}
              />
              <label
                htmlFor={id}
                className="flex flex-1 cursor-pointer items-center justify-between gap-3 text-sm text-foreground"
              >
                <span>{opt.label}</span>
                {opt.count != null && (
                  <span className="text-xs tabular-nums text-muted-foreground">
                    {opt.count}
                    <span className="sr-only"> watches</span>
                  </span>
                )}
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
  currency,
  min,
  max,
  onCommit,
}: {
  bounds: NonNullable<ShopOptions["bounds"]>;
  currency: CurrencyOptions;
  min: number | null;
  max: number | null;
  onCommit: (range: [number, number]) => void;
}) {
  const clamp = (v: number) => Math.min(bounds.max, Math.max(bounds.min, v));
  const [range, setRange] = useState<[number, number]>([clamp(min ?? bounds.min), clamp(max ?? bounds.max)]);

  return (
    <fieldset>
      <GroupLegend>Price</GroupLegend>
      <div className="clear-left mb-5 flex items-center justify-between text-sm tabular-nums" aria-hidden>
        <span className="text-foreground">{formatPrice(range[0], currency)}</span>
        <span className="mx-3 h-px flex-1 bg-border" />
        <span className="text-foreground">{formatPrice(range[1], currency)}</span>
      </div>
      <Slider
        min={bounds.min}
        max={bounds.max}
        step={bounds.step}
        minStepsBetweenThumbs={1}
        value={range}
        onValueChange={(v) => setRange([v[0], v[1]])}
        onValueCommit={(v) => onCommit([v[0], v[1]])}
        className="py-2 [&_[data-slot=slider-range]]:bg-brand [&_[data-slot=slider-thumb]]:size-4 [&_[data-slot=slider-thumb]]:border-foreground [&_[data-slot=slider-thumb]]:bg-background [&_[data-slot=slider-track]]:bg-border"
        thumbLabels={["Minimum price", "Maximum price"]}
      />
    </fieldset>
  );
}
