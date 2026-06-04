import React, { createContext, useContext, useState, useCallback } from 'react';
import { get, post } from '../api/client';
import { useAuth } from './AuthContext';

export interface CartItem {
  key: string;
  product_id: number;
  name: string;
  image: string | null;
  price: number;
  qty: number;
  line_total: number;
}

export interface Cart {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  total: number;
  shipping_total: number;
  discount_total: number;
  currency: string;
}

const emptyCart: Cart = {
  items: [], item_count: 0, subtotal: 0, total: 0,
  shipping_total: 0, discount_total: 0, currency: 'GNF',
};

interface CartState {
  cart: Cart;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (product_id: number, qty?: number) => Promise<void>;
  updateQty: (key: string, qty: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
}

const CartContext = createContext<CartState | null>(null);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart]       = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);

  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await get<Cart>('/cart', true);
      setCart(data);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const addToCart = useCallback(async (product_id: number, qty = 1) => {
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/add', { product_id, qty }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const updateQty = useCallback(async (key: string, qty: number) => {
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/update', { key, qty }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const removeItem = useCallback(async (key: string) => {
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/remove', { key }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, []);

  const clearCart = useCallback(async () => {
    setLoading(true);
    try {
      await post('/cart/clear', {}, true);
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateQty, removeItem, clearCart }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
