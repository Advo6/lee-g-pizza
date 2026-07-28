"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { v4 as uuidv4 } from "uuid";
import type { CartItem, CrustType, PizzaSize } from "@/lib/utils";

interface CartContextValue {
  items: CartItem[];
  itemCount: number;
  subtotal: number;
  addItem: (item: Omit<CartItem, "id">) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  clearCart: () => void;
  addItemFromAI: (params: {
    productName: string;
    size?: PizzaSize;
    crust?: CrustType;
    toppingNames?: string[];
    quantity?: number;
  }) => Promise<{ success: boolean; message: string }>;
}

const CartContext = createContext<CartContextValue | null>(null);

const CART_STORAGE_KEY = "lee-g-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    try {
      const stored = localStorage.getItem(CART_STORAGE_KEY);
      if (stored) setItems(JSON.parse(stored));
    } catch {
      /* ignore */
    }
    setHydrated(true);
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem = useCallback((item: Omit<CartItem, "id">) => {
    setItems((prev) => [...prev, { ...item, id: uuidv4() }]);
  }, []);

  const removeItem = useCallback((id: string) => {
    setItems((prev) => prev.filter((i) => i.id !== id));
  }, []);

  const updateQuantity = useCallback((id: string, quantity: number) => {
    if (quantity < 1) return;
    setItems((prev) =>
      prev.map((i) =>
        i.id === id
          ? {
              ...i,
              quantity,
              totalPrice: (i.basePrice + i.toppingsPrice) * quantity,
            }
          : i
      )
    );
  }, []);

  const clearCart = useCallback(() => setItems([]), []);

  const addItemFromAI = useCallback(
    async (params: {
      productName: string;
      size?: PizzaSize;
      crust?: CrustType;
      toppingNames?: string[];
      quantity?: number;
    }) => {
      const res = await fetch("/api/cart/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });
      const data = await res.json();
      if (data.success && data.item) {
        addItem(data.item);
        return { success: true, message: data.message };
      }
      return { success: false, message: data.message || "Could not add item" };
    },
    [addItem]
  );

  const itemCount = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  const subtotal = useMemo(
    () => items.reduce((sum, i) => sum + i.totalPrice, 0),
    [items]
  );

  const value = useMemo(
    () => ({
      items,
      itemCount,
      subtotal,
      addItem,
      removeItem,
      updateQuantity,
      clearCart,
      addItemFromAI,
    }),
    [items, itemCount, subtotal, addItem, removeItem, updateQuantity, clearCart, addItemFromAI]
  );

  return <CartContext.Provider value={value}>{children}</CartContext.Provider>;
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within CartProvider");
  return ctx;
}
