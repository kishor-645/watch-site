"use client";

import { useCallback, useRef, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

export interface GalleryImage {
  url: string;
  alt: string;
}

const pad = (n: number) => String(n).padStart(2, "0");
// Shared by the mobile track and the desktop stage so both `priority` copies of the first image
// resolve to the same srcset candidate (one download, not two).
// Neutral tile behind the contained packshot: surface colour + a soft light radial, so non-square or
// white-background uploads sit on a gentle pedestal instead of being cropped or showing harsh edges.
const TILE = "bg-surface-2 bg-[radial-gradient(closest-side,rgb(244_238_227/0.09),transparent)]";
const MAIN_SIZES = "(min-width: 1320px) 660px, (min-width: 768px) 52vw, 100vw";

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const count = images.length;
  const [active, setActive] = useState(0);
  // The stage image only fades in when the user switches images: on first paint it is the LCP
  // element and must not start at opacity 0.
  const [switched, setSwitched] = useState(false);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const altFor = (i: number) => images[i]?.alt || (i === 0 ? name : `${name} — view ${i + 1}`);

  const select = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      setActive(next);
      setSwitched(true);
      const el = scrollerRef.current;
      // Only scroll the mobile track when it is actually displayed.
      if (el && el.offsetParent !== null) {
        const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
        el.scrollTo({ left: next * el.clientWidth, behavior: reduce ? "auto" : "smooth" });
      }
    },
    [count],
  );

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (count < 2) return;
    const map: Record<string, number> = { ArrowRight: active + 1, ArrowLeft: active - 1, Home: 0, End: count - 1 };
    if (e.key in map) {
      e.preventDefault();
      select(map[e.key]);
    }
  };

  const onScroll = () => {
    const el = scrollerRef.current;
    if (!el) return;
    const i = Math.round(el.scrollLeft / el.clientWidth);
    if (i !== active && i >= 0 && i < count) setActive(i);
  };

  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.pointerType !== "mouse") return;
    if ((e.target as HTMLElement).closest("button")) {
      setZoom(null);
      return;
    }
    const r = e.currentTarget.getBoundingClientRect();
    setZoom({ x: ((e.clientX - r.left) / r.width) * 100, y: ((e.clientY - r.top) / r.height) * 100 });
  };

  if (!count) {
    return <div className="aspect-square w-full rounded-[2rem] bg-surface-2" />;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Mobile: swipeable scroll-snap track */}
      <div className="md:hidden">
        <div
          ref={scrollerRef}
          onScroll={onScroll}
          onKeyDown={onKeyDown}
          tabIndex={0}
          role="region"
          aria-roledescription="carousel"
          aria-label={`${name} — image gallery${count > 1 ? ", swipe to browse" : ""}`}
          className="no-scrollbar flex snap-x snap-mandatory overflow-x-auto rounded-[1.5rem] border border-foreground/[0.07] bg-surface-2"
        >
          {images.map((img, i) => (
            <div
              key={img.url + i}
              className={cn("relative aspect-square w-full shrink-0 snap-center snap-always", TILE)}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} of ${count}`}
            >
              <Image
                src={img.url}
                alt={altFor(i)}
                fill
                priority={i === 0}
                sizes={MAIN_SIZES}
                className="object-contain"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <div className="mt-3 flex items-center justify-center gap-1">
            {images.map((_, i) => (
              <button
                key={i}
                type="button"
                onClick={() => select(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === active}
                className="group grid h-8 w-9 place-items-center"
              >
                <span
                  className={cn(
                    "block h-1.5 rounded-full transition-[width,background-color] duration-300 ease-quiet",
                    i === active ? "w-7 bg-aurora" : "w-1.5 bg-foreground/25 group-hover:bg-foreground/50",
                  )}
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Tablet/desktop: large main image with hover zoom */}
      <div
        tabIndex={0}
        role="region"
        aria-roledescription="carousel"
        aria-label={`${name} — image ${active + 1} of ${count}${count > 1 ? ". Use arrow keys to browse." : ""}`}
        onKeyDown={onKeyDown}
        onPointerMove={onPointerMove}
        onPointerLeave={() => setZoom(null)}
        className={cn(
          "group relative hidden aspect-square w-full cursor-zoom-in overflow-hidden rounded-[2rem] border border-foreground/[0.07] shadow-[var(--shadow-lift)] motion-reduce:cursor-default md:block",
          TILE,
        )}
      >
        <Image
          key={active}
          src={images[active].url}
          alt={altFor(active)}
          fill
          priority={active === 0}
          sizes={MAIN_SIZES}
          className={cn(
            switched && "fade-in",
            "object-contain transition-transform duration-300 ease-quiet will-change-transform motion-reduce:transform-none!",
          )}
          style={{
            transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%",
            transform: zoom ? "scale(1.6)" : "scale(1)",
          }}
        />

        {count > 1 && (
          <>
            <GalleryArrow side="left" onClick={() => select(active - 1)} />
            <GalleryArrow side="right" onClick={() => select(active + 1)} />
          </>
        )}
      </div>

      {/* Thumbnails + counter (tablet/desktop) */}
      {count > 1 && (
        <div className="hidden items-start justify-between gap-6 md:flex">
          <ul className="flex flex-wrap gap-3 p-1" aria-label="Choose image">
            {images.map((img, i) => (
              <li key={img.url + i}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`Show image ${i + 1} of ${count}`}
                  aria-current={i === active}
                  className={cn(
                    "relative block size-[76px] overflow-hidden rounded-[0.875rem] bg-surface-2 transition-[opacity,box-shadow] duration-300",
                    i === active
                      ? "opacity-100 ring-2 ring-brand-ink ring-offset-2 ring-offset-background"
                      : "opacity-60 hover:opacity-100",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="76px" className="object-cover" />
                </button>
              </li>
            ))}
          </ul>
          <p aria-hidden className="shrink-0 pt-2 font-display text-sm font-semibold tabular-nums text-muted-foreground">
            {pad(active + 1)} / {pad(count)}
          </p>
        </div>
      )}
    </div>
  );
}

function GalleryArrow({ side, onClick }: { side: "left" | "right"; onClick: () => void }) {
  const Icon = side === "left" ? ChevronLeft : ChevronRight;
  return (
    <button
      type="button"
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      aria-label={side === "left" ? "Previous image" : "Next image"}
      className={cn(
        "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-white/15 bg-background/70 text-foreground opacity-0 backdrop-blur-md transition-[opacity,background-color] duration-300 ease-quiet hover:bg-background focus-visible:opacity-100 group-hover:opacity-100 group-focus-visible:opacity-100",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
