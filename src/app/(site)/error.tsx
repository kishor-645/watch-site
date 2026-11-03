"use client";

import { useEffect } from "react";
import Link from "next/link";
import { RotateCcw } from "lucide-react";
import { ctaPrimary, ctaSecondary } from "@/components/home/section-heading";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => {
    console.error(error);
  }, [error]);

  return (
    <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
      <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Something went wrong</p>
      <h1 className="mt-4 text-4xl font-light leading-tight sm:text-5xl">We couldn&apos;t load this page</h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        This is usually temporary. Please try again in a moment — or use the WhatsApp button to reach us directly.
      </p>
      {error.digest && <p className="mt-4 text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <button type="button" onClick={reset} className={ctaPrimary}>
          <RotateCcw aria-hidden className="size-4" />
          Try again
        </button>
        <Link href="/" className={ctaSecondary}>
          Return home
        </Link>
      </div>
    </div>
  );
}
