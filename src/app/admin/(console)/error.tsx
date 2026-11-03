"use client";

import { useEffect, useTransition } from "react";
import { useRouter } from "next/navigation";
import { TriangleAlertIcon } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function ConsoleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
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
    <div role="alert" className="flex flex-col items-center gap-3 rounded-lg border border-border bg-card px-6 py-12 text-center">
      <TriangleAlertIcon className="size-8 text-destructive" aria-hidden />
      <h1 className="font-sans text-lg font-semibold tracking-normal">This page could not be loaded</h1>
      <p className="max-w-md text-sm text-muted-foreground">
        The database may be temporarily unreachable. Please try again in a moment.
        {error.digest && <span className="mt-1 block text-xs">Reference: {error.digest}</span>}
      </p>
      <div className="mt-2 flex gap-2">
        <Button onClick={retry} disabled={retrying} aria-busy={retrying}>
          {retrying ? "Retrying…" : "Try again"}
        </Button>
        <Button variant="outline" onClick={() => window.location.assign("/admin")}>
          Go to dashboard
        </Button>
      </div>
    </div>
  );
}
