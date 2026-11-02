import Image from "next/image";
import Link from "next/link";
import { watches } from "@/data/watches";
import { Reveal } from "@/components/motion/reveal";
import { SectionHeading, container } from "@/components/home/section-heading";
import type { Watch } from "@/lib/types";
import { cn } from "@/lib/utils";

interface StyleTile {
  label: string;
  caption: string;
  href: string;
  match: (w: Watch) => boolean;
  className?: string;
}

const TILES: StyleTile[] = [
  {
    label: "For Him",
    caption: "Bold cases, assured presence",
    href: "/shop?gender=men",
    match: (w) => w.gender === "men",
    className: "col-span-2 row-span-2 lg:col-span-2",
  },
  {
    label: "For Her",
    caption: "Refined, luminous, light on the wrist",
    href: "/shop?gender=women",
    match: (w) => w.gender === "women",
    className: "col-span-1",
  },
  {
    label: "Dress",
    caption: "Slim and black-tie ready",
    href: "/shop?category=dress",
    match: (w) => w.category === "dress",
    className: "col-span-1",
  },
  {
    label: "Diver",
    caption: "Built for the deep",
    href: "/shop?category=diver",
    match: (w) => w.category === "diver",
    className: "col-span-1",
  },
  {
    label: "Chronograph",
    caption: "Precision, measured",
    href: "/shop?category=chronograph",
    match: (w) => w.category === "chronograph",
    className: "col-span-1",
  },
];

/** Picks a distinct image per tile so the mosaic never repeats a photo when it can avoid it. */
function resolveImages(): string[] {
  const used = new Set<string>();
  return TILES.map((tile) => {
    const candidates = watches.filter(tile.match).flatMap((w) => w.images);
    const pick = candidates.find((src) => !used.has(src)) ?? candidates[0] ?? watches[0]?.images[0];
    if (pick) used.add(pick);
    return pick ?? "";
  });
}

export function ShopByStyle() {
  const images = resolveImages();

  return (
    <section aria-labelledby="style-heading" className="py-24 lg:py-32">
      <div className={container}>
        <Reveal>
          <SectionHeading
            id="style-heading"
            eyebrow="Shop by Style"
            align="center"
            title={
              <>
                Find the one that <span className="italic text-gold-gradient">speaks to you</span>
              </>
            }
          />
        </Reveal>

        <ul className="mt-14 grid auto-rows-[11rem] grid-cols-2 gap-3 sm:auto-rows-[15rem] sm:gap-4 lg:auto-rows-[17rem] lg:grid-cols-4 lg:gap-5">
          {TILES.map((tile, i) => (
            <li key={tile.label} className={cn("h-full", tile.className)}>
              <Reveal delay={i * 0.06} className="h-full">
                <Link
                  href={tile.href}
                  className="group relative block h-full overflow-hidden rounded-sm border border-border outline-none transition-colors hover:border-gold/40 focus-visible:border-gold focus-visible:ring-2 focus-visible:ring-gold/50"
                >
                  {images[i] && (
                    <Image
                      src={images[i]}
                      alt=""
                      fill
                      sizes={i === 0 ? "(min-width: 1024px) 50vw, 100vw" : "(min-width: 1024px) 25vw, 50vw"}
                      className="object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-110"
                    />
                  )}
                  <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent" />
                  <span className="absolute inset-x-0 bottom-0 p-4 sm:p-6">
                    <span className={cn("block font-serif leading-none text-foreground", i === 0 ? "text-4xl sm:text-5xl" : "text-2xl sm:text-3xl")}>
                      {tile.label}
                    </span>
                    <span className="mt-2 hidden text-xs tracking-wide text-foreground/70 sm:block">{tile.caption}</span>
                    <span aria-hidden className="mt-3 block h-px w-8 bg-gold transition-all duration-500 group-hover:w-16" />
                  </span>
                </Link>
              </Reveal>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
