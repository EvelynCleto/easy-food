import { createContext, useContext, useEffect, useMemo, useState, type ReactNode } from "react";

export type CartItem = {
  productId: string;
  name: string;
  price: number;
  image: string | null;
  quantity: number;
};

type CartCtx = {
  items: CartItem[];
  count: number;
  subtotal: number;
  add: (item: Omit<CartItem, "quantity">, qty?: number) => void;
  remove: (productId: string) => void;
  setQty: (productId: string, qty: number) => void;
  clear: () => void;
};

const Ctx = createContext<CartCtx | null>(null);
const KEY = "easyfood_cart_v1";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) setItems(JSON.parse(raw));
    } catch {}
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem(KEY, JSON.stringify(items));
  }, [items]);

  const value = useMemo<CartCtx>(() => {
    const subtotal = items.reduce((a, i) => a + i.price * i.quantity, 0);
    const count = items.reduce((a, i) => a + i.quantity, 0);
    return {
      items,
      count,
      subtotal,
      add: (item, qty = 1) =>
        setItems((prev) => {
          const existing = prev.find((p) => p.productId === item.productId);
          if (existing)
            return prev.map((p) =>
              p.productId === item.productId ? { ...p, quantity: p.quantity + qty } : p,
            );
          return [...prev, { ...item, quantity: qty }];
        }),
      remove: (id) => setItems((p) => p.filter((i) => i.productId !== id)),
      setQty: (id, qty) =>
        setItems((p) =>
          qty <= 0
            ? p.filter((i) => i.productId !== id)
            : p.map((i) => (i.productId === id ? { ...i, quantity: qty } : i)),
        ),
      clear: () => setItems([]),
    };
  }, [items]);

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useCart() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useCart must be used inside CartProvider");
  return v;
}