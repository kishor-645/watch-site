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
 */
export function ShopStateProvider({ query, children }: { query: CatalogQuery; children: React.ReactNode }) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();

  const navigate = useCallback(
    (patch: Partial<CatalogQuery>) => {
      const qs = serializeCatalogQuery({ ...query, page: 1, ...patch });
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
