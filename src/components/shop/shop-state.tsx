"use client";

import { createContext, useCallback, useContext, useMemo, useTransition } from "react";
import { useRouter } from "next/navigation";
import { serializeCatalogQuery } from "@/lib/schemas/catalog-query";
import type { CatalogQuery } from "@/lib/types";
import { cn } from "@/lib/utils";

interface ShopState {
  query: CatalogQuery;
  /** Applies a patch to the current query and navigates (page resets to 1 unless given). */
  navigate: (patch: Partial<CatalogQuery>) => void;
  pending: boolean;
}

const ShopContext = createContext<ShopState | null>(null);

export function useShop(): ShopState {
  const ctx = useContext(ShopContext);
  if (!ctx) throw new Error("useShop must be used inside <ShopStateProvider>");
  return ctx;
}

/**
 * The URL is the single source of truth: filters only change the query string and the server
 * re-renders the results. `query` is the server-parsed `CatalogQuery` for this request.
 *
 * `navigate` is the only place the shop calls the router: one `router.push`, and nothing syncs the
 * URL back. The /shop route deliberately has no `loading.tsx`: in production a loading boundary
 * makes Next 15 serve `/shop?…` navigations from an "aliased" (search-param-less) prefetch entry
 * that only carries the loading state, and the page data is then fetched from inside the suspended
 * render and applied by a separate server-patch action. That path occasionally left a navigation
 * suspended forever (BUG-3: response received, URL never updated, results stuck dimmed).
 */
export function ShopStateProvider({ query, children }: { query: CatalogQuery; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch: Partial<CatalogQuery>) => {
      const qs = serializeCatalogQuery({ ...query, page: 1, ...patch });
      if (qs === serializeCatalogQuery(query)) return; // nothing changed: don't start a navigation
      startTransition(() => router.push(qs ? `/shop?${qs}` : "/shop", { scroll: false }));
    },
    [query, router],
  );

  const value = useMemo(() => ({ query, navigate, pending }), [query, navigate, pending]);
  return <ShopContext.Provider value={value}>{children}</ShopContext.Provider>;
}

/** Dims server-rendered results while a filter navigation is in flight. */
export function PendingRegion({ children, className }: { children: React.ReactNode; className?: string }) {
  const { pending } = useShop();
  return (
    <div aria-busy={pending} className={cn("transition-opacity duration-200", pending && "opacity-50", className)}>
      {children}
    </div>
  );
}
