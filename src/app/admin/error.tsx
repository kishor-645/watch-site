"use client";

import ConsoleError from "./(console)/error";

/** Catches failures in the console layout itself (e.g. database unreachable while checking the session). */
export default function AdminError(props: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-screen max-w-xl items-center px-4 font-sans">
      <div className="w-full">
        <ConsoleError {...props} />
      </div>
    </main>
  );
}
