"use client";

import { useEffect, useTransition } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { ctaPrimary, ctaSecondary } from "@/components/home/section-heading";

export default function SiteError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();

  useEffect(() => {
    console.error(error);
  }, [error]);

  // reset() alone only re-renders the client tree; refresh() re-requests the server components.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <div className="relative isolate overflow-hidden">
      <div aria-hidden className="bg-grid absolute inset-0 -z-10" />
      <div aria-hidden className="orb orb-violet left-[15%] top-0 -z-10 size-[24rem]" />
      <div aria-hidden className="orb orb-orange bottom-0 right-[10%] -z-10 size-[20rem]" />
      <div className="mx-auto flex max-w-2xl flex-col items-center px-6 py-24 text-center md:py-32">
      <p className="eyebrow rounded-full border border-border bg-card/60 px-3 py-1.5 text-muted-foreground">Something went wrong</p>
      <h1 className="type-h1 mt-6 text-balance text-foreground">We couldn&apos;t load this page</h1>
      <p className="mt-6 max-w-md text-sm leading-relaxed text-muted-foreground md:text-base">
        This is usually temporary. Please try again in a moment — or use the WhatsApp button to reach us directly.
      </p>
      {error.digest && <p className="mt-4 text-xs text-muted-foreground/70">Reference: {error.digest}</p>}
      <div className="mt-10 flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:gap-4">
        <button type="button" onClick={retry} disabled={retrying} aria-busy={retrying} className={ctaPrimary}>
          <RotateCcw aria-hidden className={retrying ? "size-4 animate-spin" : "size-4"} />
          {retrying ? "Retrying…" : "Try again"}
        </button>
        <Link href="/" className={ctaSecondary}>
          Return home
        </Link>
      </div>
      </div>
    </div>
  );
}
