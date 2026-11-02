import { BadgeCheck, Cog, Droplets, Gem, Link2, RotateCcw, Ruler, ShieldCheck, Truck } from "lucide-react";
import { categoryLabels } from "@/lib/catalog";
import { formatPrice } from "@/lib/format";
import type { Watch } from "@/lib/types";
import { ProductPurchase } from "./product-purchase";
import { RatingStars } from "./rating-stars";

const trustPoints = [
  { icon: Truck, title: "Free shipping", text: "Insured, across India" },
  { icon: ShieldCheck, title: "2-year warranty", text: "International cover" },
  { icon: RotateCcw, title: "Easy returns", text: "Within 15 days" },
  { icon: BadgeCheck, title: "100% authentic", text: "Certified & sealed" },
];

export function ProductInfo({ watch }: { watch: Watch }) {
  const onSale = watch.compareAtPrice != null && watch.compareAtPrice > watch.price;
  const discount = onSale ? Math.round((1 - watch.price / watch.compareAtPrice!) * 100) : 0;

  const keySpecs = [
    { icon: Ruler, label: "Case size", value: watch.specs.caseSize },
    { icon: Cog, label: "Movement", value: watch.specs.movement },
    { icon: Droplets, label: "Water resistance", value: watch.specs.waterResistance },
    { icon: Gem, label: "Material", value: watch.specs.caseMaterial },
    { icon: Link2, label: "Strap", value: watch.specs.strap },
  ];

  return (
    <div className="flex flex-col">
      <p className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">
        {watch.brand}
        <span aria-hidden className="h-px w-6 bg-gold/50" />
        <span className="text-muted-foreground">{categoryLabels[watch.category]}</span>
      </p>

      <h1 className="mt-4 text-4xl font-light leading-[1.05] sm:text-5xl xl:text-[3.5rem]">{watch.name}</h1>

      <a
        href="#details"
        className="mt-5 inline-flex w-fit items-center gap-3 rounded-sm text-sm text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/60"
      >
        <RatingStars rating={watch.rating} />
        <span className="tabular-nums">
          <span className="text-foreground">{watch.rating.toFixed(1)}</span>
          <span aria-hidden> · </span>
          {watch.reviewCount.toLocaleString("en-IN")} reviews
        </span>
      </a>

      <div className="mt-8 flex flex-wrap items-baseline gap-x-4 gap-y-2">
        <p className="font-serif text-4xl tabular-nums text-foreground">
          <span className="sr-only">Price: </span>
          {formatPrice(watch.price)}
        </p>
        {onSale && (
          <>
            <p className="text-lg tabular-nums text-muted-foreground line-through">
              <span className="sr-only">Original price: </span>
              {formatPrice(watch.compareAtPrice!)}
            </p>
            <span className="rounded-full border border-gold/40 bg-gold/10 px-3 py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-gold">
              Save {discount}%
            </span>
          </>
        )}
      </div>
      <p className="mt-2 text-xs text-muted-foreground">Inclusive of all taxes · Free insured delivery</p>

      <p className="mt-8 max-w-xl text-base leading-relaxed text-foreground/80">{watch.shortDescription}</p>

      <dl className="mt-10 grid grid-cols-2 gap-px overflow-hidden rounded-lg border border-border bg-border sm:grid-cols-3">
        {keySpecs.map(({ icon: Icon, label, value }) => (
          <div key={label} className="flex flex-col gap-2 bg-card px-4 py-5">
            <Icon aria-hidden className="size-4 text-gold" strokeWidth={1.5} />
            <dt className="text-[10px] uppercase tracking-[0.25em] text-muted-foreground">{label}</dt>
            <dd className="text-sm leading-snug text-foreground">{value}</dd>
          </div>
        ))}
        {/* Filler cell keeps the hairline grid even on 2- and 3-column layouts */}
        <div aria-hidden className="bg-card" />
      </dl>

      <div className="mt-10">
        <ProductPurchase watch={watch} />
      </div>

      <ul className="mt-10 grid grid-cols-2 gap-x-6 gap-y-6 border-t border-border pt-8">
        {trustPoints.map(({ icon: Icon, title, text }) => (
          <li key={title} className="flex items-start gap-3">
            <span className="grid size-9 shrink-0 place-items-center rounded-full border border-gold/25 text-gold">
              <Icon aria-hidden className="size-4" strokeWidth={1.5} />
            </span>
            <span>
              <span className="block text-sm text-foreground">{title}</span>
              <span className="block text-xs text-muted-foreground">{text}</span>
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
