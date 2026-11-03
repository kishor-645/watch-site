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
const MAIN_SIZES = "(min-width: 1440px) 680px, (min-width: 768px) 50vw, 100vw";

export function ProductGallery({ images, name }: { images: GalleryImage[]; name: string }) {
  const count = images.length;
  const [active, setActive] = useState(0);
  const [zoom, setZoom] = useState<{ x: number; y: number } | null>(null);
  const scrollerRef = useRef<HTMLDivElement>(null);
  const altFor = (i: number) => images[i]?.alt || (i === 0 ? name : `${name} — view ${i + 1}`);

  const select = useCallback(
    (index: number) => {
      const next = (index + count) % count;
      setActive(next);
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
    return <div className="aspect-square w-full rounded-sm border border-border bg-card" />;
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
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto bg-card sm:-mx-8"
        >
          {images.map((img, i) => (
            <div
              key={img.url + i}
              className="relative aspect-square w-full shrink-0 snap-center snap-always"
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
                className="object-cover"
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
                className="group grid size-7 place-items-center rounded-full"
              >
                <span
                  className={cn(
                    "block h-1 rounded-full transition-all duration-300",
                    i === active ? "w-5 bg-gold" : "w-1.5 bg-foreground/30 group-hover:bg-foreground/60",
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
        className="group relative hidden aspect-square w-full cursor-zoom-in overflow-hidden rounded-sm border border-border bg-card md:block"
      >
        <Image
          key={active}
          src={images[active].url}
          alt={altFor(active)}
          fill
          priority={active === 0}
          sizes={MAIN_SIZES}
          className="fade-in object-cover transition-transform duration-300 ease-out will-change-transform"
          style={{
            transformOrigin: zoom ? `${zoom.x}% ${zoom.y}%` : "50% 50%",
            transform: zoom ? "scale(1.8)" : "scale(1)",
          }}
        />

        {count > 1 && (
          <>
            <span
              aria-hidden
              className="pointer-events-none absolute bottom-4 right-4 rounded-full bg-background/70 px-3 py-1.5 text-[11px] uppercase tabular-nums tracking-[0.3em] text-foreground/80 backdrop-blur transition-opacity group-hover:opacity-0"
            >
              {pad(active + 1)} / {pad(count)}
            </span>
            <GalleryArrow side="left" onClick={() => select(active - 1)} />
            <GalleryArrow side="right" onClick={() => select(active + 1)} />
          </>
        )}
      </div>

      {/* Thumbnails (tablet/desktop) */}
      {count > 1 && (
        <ul className="hidden grid-cols-5 gap-3 md:grid" aria-label="Choose image">
          {images.map((img, i) => (
            <li key={img.url + i}>
              <button
                type="button"
                onClick={() => select(i)}
                aria-label={`Show image ${i + 1} of ${count}`}
                aria-current={i === active}
                className={cn(
                  "relative block aspect-square w-full overflow-hidden rounded-sm border bg-card transition-[opacity,border-color] duration-300",
                  i === active ? "border-gold/70 opacity-100" : "border-border opacity-60 hover:border-gold/30 hover:opacity-90",
                )}
              >
                <Image src={img.url} alt="" fill sizes="120px" className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
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
        "absolute top-1/2 grid size-11 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-background/70 text-foreground/80 opacity-0 backdrop-blur transition-opacity duration-300 hover:border-gold/50 hover:text-gold focus-visible:opacity-100 group-hover:opacity-100",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
