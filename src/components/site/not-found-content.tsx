import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { ctaPrimary, ctaSecondary } from "@/components/home/section-heading";

/** Shared 404 body (used by the root and the public-site not-found pages). */
export function NotFoundContent({ headingLevel: Heading = "h1" }: { headingLevel?: "h1" | "h2" }) {
  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center md:py-28">
      <StoppedDial />
      <p className="eyebrow mt-10 text-muted-foreground">Error 404</p>
      <Heading className="type-h1 mt-4 text-foreground">This page could not be found</Heading>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        The page you are looking for has moved, is no longer available, or the link is incorrect.
      </p>
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <Link href="/shop" className={ctaPrimary}>
          Explore the collection
          <ArrowRight aria-hidden className="size-4" />
        </Link>
        <Link href="/" className={ctaSecondary}>
          Return home
        </Link>
      </div>
    </div>
  );
}

/** A minimal dial frozen at 4:04. */
function StoppedDial() {
  const ticks = Array.from({ length: 60 }, (_, i) => i);
  return (
    <svg viewBox="0 0 200 200" className="size-32 text-foreground md:size-40" aria-hidden focusable="false">
      <circle cx="100" cy="100" r="96" fill="none" stroke="currentColor" strokeOpacity="0.35" strokeWidth="0.75" />
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
      <line x1="100" y1="100" x2="100" y2="58" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" transform="rotate(122 100 100)" />
      <line x1="100" y1="108" x2="100" y2="34" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" transform="rotate(24 100 100)" />
      <circle cx="100" cy="100" r="3.5" fill="currentColor" />
    </svg>
  );
}
