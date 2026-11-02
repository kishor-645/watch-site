import Image from "next/image";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Reveal } from "@/components/motion/reveal";
import { container, ctaPrimary, ctaSecondary } from "@/components/home/section-heading";
import { formatPrice } from "@/lib/format";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";

export function FlagshipSpotlight({ watch }: { watch: Watch }) {
  const { specs } = watch;
  const rows = [
    { label: "Case", value: `${specs.caseSize} · ${specs.caseMaterial}` },
    { label: "Movement", value: specs.movement },
    { label: "Water resistance", value: specs.waterResistance },
    { label: "Crystal", value: specs.crystal },
    specs.powerReserve
      ? { label: "Power reserve", value: specs.powerReserve }
      : { label: "Strap", value: specs.strap },
    { label: "Warranty", value: specs.warranty },
  ];
  const image = watch.images[1] ?? watch.images[0];

  return (
    <section aria-labelledby="spotlight-heading" className="py-24 lg:py-32">
      <div className={cn(container, "grid items-center gap-12 lg:grid-cols-2 lg:gap-20")}>
        <Reveal className="relative">
          <div className="relative aspect-[4/5] overflow-hidden rounded-sm border border-gold/15">
            <Image
              src={image}
              alt={`${watch.name} detail`}
              fill
              sizes="(min-width: 1024px) 45vw, 100vw"
              className="object-cover"
            />
            <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
          </div>
          {/* Offset hairline frame */}
          <span aria-hidden className="pointer-events-none absolute -bottom-4 -right-4 hidden h-full w-full border border-gold/25 lg:block" />
          <span className="absolute left-5 top-5 bg-gold px-3 py-1.5 text-[0.6rem] font-semibold uppercase tracking-[0.25em] text-primary-foreground">
            Flagship
          </span>
        </Reveal>

        <Reveal delay={0.1}>
          <p className="flex items-center gap-3 text-[0.7rem] font-medium uppercase tracking-[0.3em] text-gold">
            <span aria-hidden className="h-px w-8 bg-gold/60" />
            In the Spotlight
          </p>
          <h2 id="spotlight-heading" className="mt-5 text-4xl font-medium leading-[1.05] sm:text-5xl lg:text-6xl">
            {watch.name.replace(/^MyWatch\s+/i, "")}
          </h2>
          <p className="mt-2 text-[0.7rem] uppercase tracking-[0.3em] text-muted-foreground">{watch.brand}</p>
          <p className="mt-6 max-w-lg text-base leading-relaxed text-muted-foreground sm:text-lg">
            {watch.shortDescription}
          </p>

          <dl className="mt-10 grid grid-cols-1 border-t border-border sm:grid-cols-2 sm:gap-x-10">
            {rows.map((row) => (
              <div key={row.label} className="flex flex-col gap-1 border-b border-border py-4">
                <dt className="text-[0.6rem] uppercase tracking-[0.3em] text-muted-foreground">{row.label}</dt>
                <dd className="text-sm text-foreground">{row.value}</dd>
              </div>
            ))}
          </dl>

          <div className="mt-10 flex flex-col gap-6 sm:flex-row sm:items-center">
            <p className="font-serif text-3xl font-semibold text-gold">{formatPrice(watch.price)}</p>
            <div className="flex flex-col gap-3 sm:flex-row">
              <Link href={`/watches/${watch.slug}`} className={ctaPrimary}>
                Discover the Aurora
                <ArrowRight className="size-4 transition-transform group-hover/cta:translate-x-1" aria-hidden />
              </Link>
              <Link href="/shop?category=chronograph" className={ctaSecondary}>
                All Chronographs
              </Link>
            </div>
          </div>
        </Reveal>
      </div>
    </section>
  );
}
