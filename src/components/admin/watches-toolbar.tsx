"use client";

import * as React from "react";
import { usePathname, useRouter } from "next/navigation";
import { SearchIcon, XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AVAILABILITY, availabilityLabels } from "@/lib/schemas/watch";
import { NativeSelect } from "./form-field";

interface ToolbarValues {
  q: string;
  status: string;
  availability: string;
}

export function WatchesToolbar({ initial }: { initial: ToolbarValues }) {
  const router = useRouter();
  const pathname = usePathname();
  const [q, setQ] = React.useState(initial.q);
  const [isPending, startTransition] = React.useTransition();

  // Keep the box in sync when the URL changes externally (back/forward, links).
  React.useEffect(() => setQ(initial.q), [initial.q]);

  const navigate = React.useCallback(
    (next: Partial<ToolbarValues>) => {
      const values = { ...initial, q, ...next };
      const sp = new URLSearchParams();
      if (values.q.trim()) sp.set("q", values.q.trim());
      if (values.status !== "all") sp.set("status", values.status);
      if (values.availability !== "all") sp.set("availability", values.availability);
      const qs = sp.toString();
      startTransition(() => router.push(qs ? `${pathname}?${qs}` : pathname));
    },
    [initial, q, pathname, router],
  );

  // Debounced search-as-you-type.
  React.useEffect(() => {
    if (q.trim() === initial.q.trim()) return;
    const t = setTimeout(() => navigate({ q }), 350);
    return () => clearTimeout(t);
  }, [q, initial.q, navigate]);

  const filtered = initial.q || initial.status !== "all" || initial.availability !== "all";

  return (
    <form
      role="search"
      aria-busy={isPending}
      className="mb-4 flex flex-col gap-2 sm:flex-row sm:flex-wrap sm:items-end"
      onSubmit={(e) => {
        e.preventDefault();
        navigate({ q });
      }}
    >
      <div className="flex min-w-0 flex-1 flex-col gap-1.5 sm:min-w-64">
        <label htmlFor="watch-search" className="text-xs font-medium text-muted-foreground">
          Search
        </label>
        <div className="relative">
          <SearchIcon className="pointer-events-none absolute top-1/2 left-2.5 size-4 -translate-y-1/2 text-muted-foreground" aria-hidden />
          <Input
            id="watch-search"
            type="search"
            className="h-9 pl-8"
            placeholder="Name, brand, model or slug"
            value={q}
            maxLength={80}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:flex">
        <div className="flex flex-col gap-1.5">
          <label htmlFor="watch-status" className="text-xs font-medium text-muted-foreground">
            Status
          </label>
          <NativeSelect
            id="watch-status"
            className="h-9 sm:w-36"
            value={initial.status}
            onChange={(e) => navigate({ status: e.target.value })}
          >
            <option value="all">All statuses</option>
            <option value="published">Published</option>
            <option value="draft">Draft</option>
          </NativeSelect>
        </div>
        <div className="flex flex-col gap-1.5">
          <label htmlFor="watch-availability" className="text-xs font-medium text-muted-foreground">
            Availability
          </label>
          <NativeSelect
            id="watch-availability"
            className="h-9 sm:w-44"
            value={initial.availability}
            onChange={(e) => navigate({ availability: e.target.value })}
          >
            <option value="all">All availability</option>
            {AVAILABILITY.map((a) => (
              <option key={a} value={a}>
                {availabilityLabels[a]}
              </option>
            ))}
          </NativeSelect>
        </div>
      </div>
      {filtered && (
        <Button
          type="button"
          variant="ghost"
          className="h-9"
          onClick={() => {
            setQ("");
            startTransition(() => router.push(pathname));
          }}
        >
          <XIcon aria-hidden /> Clear filters
        </Button>
      )}
    </form>
  );
}
