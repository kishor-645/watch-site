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
          <p className="eyebrow text-muted-foreground">Something went wrong</p>
          <h1 className="type-h1 mt-4 text-foreground">The site is temporarily unavailable</h1>
          <p className="mt-5 text-sm leading-relaxed text-muted-foreground">
            Please try again in a moment.
          </p>
          <div className="mt-9 flex flex-col gap-3 sm:flex-row">
            <button
              type="button"
              onClick={retry}
              disabled={retrying}
              aria-busy={retrying}
              className="type-nav inline-flex h-12 items-center justify-center rounded-sm bg-primary px-7 text-primary-foreground hover:bg-foreground/85"
            >
              {retrying ? "Retrying…" : "Try again"}
            </button>
            {/* Plain anchor: a full reload is the point here. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a
              href="/"
              className="type-nav inline-flex h-12 items-center justify-center rounded-sm border border-foreground/80 px-7 hover:bg-foreground hover:text-background"
            >
              Return home
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}
