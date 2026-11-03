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
const MAIN_SIZES = "(min-width: 1320px) 660px, (min-width: 768px) 52vw, 100vw";

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
    return <div className="aspect-square w-full bg-surface-2" />;
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
          className="no-scrollbar -mx-5 flex snap-x snap-mandatory overflow-x-auto bg-surface-2 sm:-mx-8"
        >
          {images.map((img, i) => (
            <div
              key={img.url + i}
              className="relative aspect-square w-full shrink-0 snap-center snap-always bg-surface-2"
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
                className="object-contain mix-blend-multiply"
              />
            </div>
          ))}
        </div>
        {count > 1 && (
          <div className="mt-2 flex items-center justify-center gap-1">
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
                    "block h-0.5 w-6 transition-colors duration-300",
                    i === active ? "bg-foreground" : "bg-border group-hover:bg-muted-foreground",
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
        className="group relative hidden aspect-square w-full cursor-zoom-in overflow-hidden bg-surface-2 motion-reduce:cursor-default md:block"
      >
        <Image
          key={active}
          src={images[active].url}
          alt={altFor(active)}
          fill
          priority={active === 0}
          sizes={MAIN_SIZES}
          className="fade-in object-contain mix-blend-multiply transition-transform duration-300 ease-quiet will-change-transform motion-reduce:transform-none!"
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
          <ul className="flex flex-wrap gap-2" aria-label="Choose image">
            {images.map((img, i) => (
              <li key={img.url + i}>
                <button
                  type="button"
                  onClick={() => select(i)}
                  aria-label={`Show image ${i + 1} of ${count}`}
                  aria-current={i === active}
                  className={cn(
                    "relative block size-[72px] overflow-hidden bg-surface-2 outline-offset-0 transition-opacity duration-300",
                    i === active ? "opacity-100 outline outline-1 outline-foreground" : "opacity-70 hover:opacity-100",
                  )}
                >
                  <Image src={img.url} alt="" fill sizes="72px" className="object-contain mix-blend-multiply" />
                </button>
              </li>
            ))}
          </ul>
          <p aria-hidden className="type-small shrink-0 pt-1 tabular-nums text-muted-foreground">
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
        "absolute top-1/2 grid size-10 -translate-y-1/2 cursor-pointer place-items-center rounded-full border border-border bg-background text-foreground opacity-0 transition-[opacity,border-color] duration-300 ease-quiet hover:border-foreground focus-visible:opacity-100 group-hover:opacity-100 group-focus-visible:opacity-100",
        side === "left" ? "left-4" : "right-4",
      )}
    >
      <Icon className="size-5" strokeWidth={1.5} aria-hidden />
    </button>
  );
}
