"use client";

import { useTransition } from "react";
import { useRouter } from "next/navigation";
import "./globals.css";

/** Last-resort boundary (replaces the root layout when it fails). Keep dependency-free. */
export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const router = useRouter();
  const [retrying, startTransition] = useTransition();
  // reset() alone only re-renders the client tree; refresh() re-requests the server components.
  const retry = () =>
    startTransition(() => {
      router.refresh();
      reset();
    });

  return (
    <html lang="en">
      <body className="min-h-screen bg-background font-sans text-foreground antialiased">
        <main className="mx-auto flex min-h-screen max-w-xl flex-col items-center justify-center px-6 text-center">
          <p className="text-[11px] font-medium uppercase tracking-[0.3em] text-gold">Something went wrong</p>
          <h1 className="mt-4 font-serif text-4xl font-light leading-tight">The site is temporarily unavailable</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Please try again in a moment.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              aria-busy={retrying}
              className="inline-flex h-12 items-center justify-center bg-gold px-7 text-[0.7rem] font-medium uppercase tracking-[0.25em] text-primary-foreground hover:bg-gold-light"
            >
              {retrying ? "Retrying…" : "Try again"}
            </button>
            {/* Plain anchor: a full reload is the point here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="inline-flex h-12 items-center justify-center border border-foreground/25 px-7 text-[0.7rem] font-medium uppercase tracking-[0.25em] hover:border-gold"
            >
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
