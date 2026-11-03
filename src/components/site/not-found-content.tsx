import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ctaPrimary, ctaSecondary } from "@/components/home/section-heading";

/** Shared 404 body (used by the root and the public-site not-found pages). */
export function NotFoundContent({ headingLevel: Heading = "h1" }: { headingLevel?: "h1" | "h2" }) {
  return (
    <div className="relative isolate flex w-full flex-col justify-center overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="orb orb-blue left-[10%] top-0 -z-10 size-[26rem]" />
      <div aria-hidden className="orb orb-orange bottom-0 right-[8%] -z-10 size-[22rem]" />
      <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center md:py-28">
        <div className="relative grid place-items-center">
          <p
            aria-hidden
            className="text-outline select-none font-display text-[clamp(7rem,4rem+16vw,15rem)] font-bold leading-none tracking-[-0.06em]"
          >
            404
          </p>
          <StoppedDial />
        </div>
        <p className="eyebrow mt-8 rounded-full border border-border bg-card/60 px-3 py-1.5 text-muted-foreground">
          Error 404
        </p>
        <Heading className="type-h1 mt-6 text-balance text-foreground">This page could not be found</Heading>
        <p className="type-lede mt-5 max-w-md text-muted-foreground">
          The page you are looking for has moved, is no longer available, or the link is incorrect.
        </p>
        <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
          <Link href="/shop" className={ctaPrimary}>
            Explore the collection
            <ArrowUpRight aria-hidden className="size-4" />
          </Link>
          <Link href="/" className={ctaSecondary}>
            Return home
          </Link>
        </div>
      </div>
    </div>
  );
}

/** A minimal dial frozen at 4:04, ringed in the aurora gradient. */
function StoppedDial() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg
      viewBox="0 0 200 200"
      className="absolute size-28 text-foreground drop-shadow-[0_0_30px_rgb(77_107_255/0.5)] md:size-36"
      aria-hidden
      focusable="false"
    >
      <defs>
        <linearGradient id="nf-aurora" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0%" stopColor="#4d6bff" />
          <stop offset="50%" stopColor="#8b5cf6" />
          <stop offset="100%" stopColor="#ff6b2c" />
        </linearGradient>
      </defs>
      <circle cx="100" cy="100" r="96" fill="#0a0e1c" stroke="url(#nf-aurora)" strokeWidth="3" />
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
      <line x1="100" y1="100" x2="100" y2="58" stroke="currentColor" strokeWidth="3" strokeLinecap="round" transform="rotate(122 100 100)" />
      <line x1="100" y1="108" x2="100" y2="34" stroke="#ff6b2c" strokeWidth="2" strokeLinecap="round" transform="rotate(24 100 100)" />
      <circle cx="100" cy="100" r="4" fill="currentColor" />
    </svg>
  );
}
