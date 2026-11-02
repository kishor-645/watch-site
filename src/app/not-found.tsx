import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";

export const metadata: Metadata = {
  title: "Page not found",
  robots: { index: false },
};

export default function NotFound() {
  return (
    <section className="relative overflow-hidden">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_50%_45%_at_50%_35%,color-mix(in_oklch,var(--gold)_9%,transparent),transparent_70%)]"
      />
      <div className="relative mx-auto flex max-w-3xl flex-col items-center px-6 pt-24 text-center md:pt-36">
        <StoppedDial />

        <p className="mt-12 text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Error 404</p>
        <h1 className="mt-5 text-4xl font-light leading-tight sm:text-5xl md:text-6xl">
          This moment has <em className="text-gold-gradient font-normal italic">slipped away</em>
        </h1>
        <span aria-hidden className="mt-8 h-px w-20 bg-gradient-to-r from-transparent via-gold/70 to-transparent" />
        <p className="mt-8 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
          The page you are looking for has moved or no longer exists. Allow us to guide you back to
          something timeless.
        </p>

        <div className="mt-12 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Button asChild className="h-12 px-8 text-xs font-semibold uppercase tracking-[0.25em]">
            <Link href="/shop">
              Explore the collection
              <ArrowRight aria-hidden className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            className="h-12 border-gold/40 px-8 text-xs font-semibold uppercase tracking-[0.25em] hover:border-gold hover:text-gold"
          >
            <Link href="/">Return home</Link>
          </Button>
        </div>
      </div>
    </section>
  );
}

/** A minimal dial frozen at 4:04. */
function StoppedDial() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 200 200"
      className="size-40 text-gold md:size-48"
      role="img"
      aria-label="A watch dial stopped at four minutes past four"
    >
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" />
      <circle cx="100" cy="100" r="88" fill="none" stroke="currentColor" strokeOpacity="0.15" strokeWidth="0.5" />
      {ticks.map((i) => {
        const major = i % 5 === 0;
        return (
          <line
            key={i}
            x1="100"
            y1={major ? 18 : 20}
            x2="100"
            y2={major ? 30 : 24}
            stroke="currentColor"
            strokeOpacity={major ? 0.9 : 0.35}
            strokeWidth={major ? 1.5 : 0.6}
            transform={`rotate(${i * 6} 100 100)`}
          />
        );
      })}
      {/* Hour hand: 4:04 → 122° */}
      <line x1="100" y1="100" x2="100" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" transform="rotate(122 100 100)" />
      {/* Minute hand: 4 min → 24° */}
      <line x1="100" y1="108" x2="100" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(24 100 100)" />
      <circle cx="100" cy="100" r="3.5" fill="currentColor" />
    </svg>
  );
}
