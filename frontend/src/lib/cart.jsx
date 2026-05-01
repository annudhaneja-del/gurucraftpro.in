import React, { createContext, useContext, useEffect, useState } from "react";

const CartCtx = createContext(null);

export function CartProvider({ children }) {
  const [items, setItems] = useState(() => {
    try { return JSON.parse(localStorage.getItem("gcp_cart") || "[]"); } catch { return []; }
  });

  useEffect(() => { localStorage.setItem("gcp_cart", JSON.stringify(items)); }, [items]);

  const add = (item) => {
    setItems((prev) => {
      const idx = prev.findIndex((p) => p.item_id === item.item_id && p.item_type === item.item_type);
      if (idx >= 0) {
        const copy = [...prev];
        copy[idx].qty += item.qty || 1;
        return copy;
      }
      return [...prev, { ...item, qty: item.qty || 1 }];
    });
  };

  const remove = (item_id) => setItems((p) => p.filter((i) => i.item_id !== item_id));
  const clear = () => setItems([]);
  const total = items.reduce((s, i) => s + i.price * i.qty, 0);

  return (
    <CartCtx.Provider value={{ items, add, remove, clear, total }}>
      {children}
    </CartCtx.Provider>
  );
}

export const useCart = () => useContext(CartCtx);
