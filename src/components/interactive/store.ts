"use client";
import { useCallback, useSyncExternalStore } from "react";
import type { WatchSnapshot } from "./types";

/**
 * Tiny localStorage-backed list store shared by every island on the page (same-tab listeners) and
 * across tabs (`storage` event). Snapshots are cached per raw string so `useSyncExternalStore`
 * gets a stable reference. Server snapshot is always empty → hydration-safe.
 */
const EMPTY: WatchSnapshot[] = [];

function isSnapshot(v: unknown): v is WatchSnapshot {
  if (!v || typeof v !== "object") return false;
  const o = v as Record<string, unknown>;
  return typeof o.slug === "string" && typeof o.name === "string" && typeof o.price === "number";
}

export function createListStore(key: string, max = 60) {
  const listeners = new Set<() => void>();
  let cachedRaw: string | null = null;
  let cached: WatchSnapshot[] = EMPTY;
  /** Set when localStorage is unavailable/full: the in-memory list is the source of truth. */
  let memoryOnly = false;

  function read(): WatchSnapshot[] {
    if (memoryOnly) return cached;
    let raw: string | null = null;
    try {
      raw = window.localStorage.getItem(key);
    } catch {
      return cached;
    }
    if (raw === cachedRaw) return cached;
    cachedRaw = raw;
    try {
      const parsed: unknown = raw ? JSON.parse(raw) : [];
      cached = Array.isArray(parsed) ? parsed.filter(isSnapshot).slice(0, max) : EMPTY;
    } catch {
      cached = EMPTY;
    }
    return cached;
  }

  function write(next: WatchSnapshot[]) {
    const list = next.slice(0, max);
    try {
      window.localStorage.setItem(key, JSON.stringify(list));
    } catch {
      /* private mode / quota: keep in memory for this session */
      memoryOnly = true;
      cachedRaw = JSON.stringify(list);
      cached = list;
    }
    listeners.forEach((l) => l());
  }

  let refreshed = false;
  /**
   * Once per page load: replaces stored snapshots with current public data (price, availability,
   * image) and drops watches that were deleted or unpublished. Network errors keep the local list.
   */
  async function refresh(): Promise<void> {
    if (refreshed) return;
    refreshed = true;
    const current = read();
    if (!current.length) return;
    try {
      const res = await fetch(`/api/catalog/snapshots?slugs=${encodeURIComponent(current.map((w) => w.slug).join(","))}`, {
        headers: { Accept: "application/json" },
      });
      if (!res.ok) return;
      const body = (await res.json()) as { ok: boolean; data?: { items: WatchSnapshot[] } };
      if (!body.ok || !body.data) return;
      const fresh = new Map(body.data.items.filter(isSnapshot).map((w) => [w.slug, w]));
      // Keep the user's order; read again in case the list changed while fetching.
      write(read().flatMap((w) => (fresh.has(w.slug) ? [fresh.get(w.slug)!] : [])));
    } catch {
      /* offline: keep the stored list */
    }
  }

  function subscribe(listener: () => void) {
    listeners.add(listener);
    const onStorage = (e: StorageEvent) => {
      if (e.key === key || e.key === null) listener();
    };
    window.addEventListener("storage", onStorage);
    return () => {
      listeners.delete(listener);
      window.removeEventListener("storage", onStorage);
    };
  }

  const getServerSnapshot = () => EMPTY;

  function useList(): WatchSnapshot[] {
    return useSyncExternalStore(subscribe, read, getServerSnapshot);
  }

  return {
    useList,
    read,
    write,
    refresh,
    has: (slug: string) => read().some((w) => w.slug === slug),
    remove: (slug: string) => write(read().filter((w) => w.slug !== slug)),
    /** Adds (or moves) to the front. */
    upsertFront: (w: WatchSnapshot) => write([w, ...read().filter((x) => x.slug !== w.slug)]),
  };
}

export const wishlistStore = createListStore("mywatch-wishlist", 60);
export const recentStore = createListStore("mywatch-recent", 8);

/** True after hydration (false on the server and during the hydration render). */
const noopSubscribe = () => () => {};
export function useMounted(): boolean {
  return useSyncExternalStore(
    noopSubscribe,
    () => true,
    () => false,
  );
}

export function useWishlistToggle(watch: WatchSnapshot) {
  const list = wishlistStore.useList();
  const saved = list.some((w) => w.slug === watch.slug);
  const toggle = useCallback(() => {
    if (wishlistStore.has(watch.slug)) {
      wishlistStore.remove(watch.slug);
      return false;
    }
    wishlistStore.upsertFront(watch);
    return true;
  }, [watch]);
  return { saved, toggle };
}

export { availabilityLabels as availabilityText } from "@/lib/labels";
