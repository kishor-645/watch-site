"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import type { CartItem } from "@/lib/types";

const STORAGE_KEY = "mywatch-cart";

interface CartContextValue {
  items: CartItem[];
  count: number;
  hydrated: boolean;
  addItem: (watchId: string, quantity?: number) => void;
  removeItem: (watchId: string) => void;
  setQuantity: (watchId: string, quantity: number) => void;
  clear: () => void;
}

const CartContext = createContext<CartContextValue | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt storage
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (hydrated) localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((watchId: string, quantity = 1) => {
    setItems((prev) => {
      const existing = prev.find((i) => i.watchId === watchId);
      if (existing) {
        return prev.map((i) =>
          i.watchId === watchId ? { ...i, quantity: Math.min(i.quantity + quantity, 10) } : i,
        );
      }
      return [...prev, { watchId, quantity }];
    });
  }, []);

  const removeItem = useCallback((watchId: string) => {
    setItems((prev) => prev.filter((i) => i.watchId !== watchId));
  }, []);

  const setQuantity = useCallback((watchId: string, quantity: number) => {
    setItems((prev) =>
      quantity <= 0
        ? prev.filter((i) => i.watchId !== watchId)
        : prev.map((i) => (i.watchId === watchId ? { ...i, quantity: Math.min(quantity, 10) } : i)),
    );
  }, []);

  const clear = useCallback(() => setItems([]), []);

  const value = useMemo(
    () => ({
      items,
      count: items.reduce((sum, i) => sum + i.quantity, 0),
      hydrated,
      addItem,
      removeItem,
      setQuantity,
      clear,
    }),
    [items, hydrated, addItem, removeItem, setQuantity, clear],
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
