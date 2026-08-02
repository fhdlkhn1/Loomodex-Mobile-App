import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { get, post } from '../api/client';
import { productsApi } from '../api/products';
import { useAuth } from './AuthContext';

export interface CartItem {
  key: string;
  product_id: number;
  name: string;
  image: string | null;
  price: number;
  qty: number;
  line_total: number;
  // Guest-cart only — carried so a guest order can recreate the exact line
  variation_id?: number;
  variation?: Record<string, string>;
}

export interface Cart {
  items: CartItem[];
  item_count: number;
  subtotal: number;
  total: number;
  shipping_total: number;
  discount_total: number;
  coupons: string[];
  currency: string;
}

const emptyCart: Cart = {
  items: [], item_count: 0, subtotal: 0, total: 0,
  shipping_total: 0, discount_total: 0, coupons: [], currency: 'GNF',
};

const GUEST_CART_KEY = 'lmx_guest_cart';

interface CartState {
  cart: Cart;
  loading: boolean;
  fetchCart: () => Promise<void>;
  addToCart: (product_id: number, qty?: number, variationId?: number, variation?: Record<string, string>) => Promise<void>;
  updateQty: (key: string, qty: number) => Promise<void>;
  removeItem: (key: string) => Promise<void>;
  clearCart: () => Promise<void>;
  applyCoupon: (code: string) => Promise<void>;
  removeCoupon: (code: string) => Promise<void>;
  /** True when running as a guest (no account) — checkout uses the guest order path. */
  isGuest: boolean;
}

const CartContext = createContext<CartState | null>(null);

// ── Local guest cart helpers ───────────────────────────────────
function recompute(items: CartItem[]): Cart {
  const withTotals = items.map(i => ({ ...i, line_total: i.price * i.qty }));
  const subtotal = withTotals.reduce((s, i) => s + i.line_total, 0);
  const item_count = withTotals.reduce((s, i) => s + i.qty, 0);
  return {
    ...emptyCart,
    items: withTotals,
    item_count,
    subtotal,
    total: subtotal, // delivery fee is added at checkout from the chosen zone
  };
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [cart, setCart]       = useState<Cart>(emptyCart);
  const [loading, setLoading] = useState(false);
  // Snapshot of login state we last synced against — used to detect a guest→login merge
  const prevLoggedIn = useRef<boolean | null>(null);

  const persistGuest = useCallback(async (c: Cart) => {
    try { await AsyncStorage.setItem(GUEST_CART_KEY, JSON.stringify(c.items)); } catch {}
  }, []);

  // ── Guest (local) operations ─────────────────────────────────
  const loadGuestCart = useCallback(async () => {
    try {
      const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
      const items: CartItem[] = raw ? JSON.parse(raw) : [];
      setCart(recompute(items));
    } catch {
      setCart(emptyCart);
    }
  }, []);

  const guestAdd = useCallback(async (product_id: number, qty: number, variationId?: number, variation?: Record<string, string>) => {
    // Need name/price/image to show a local line — pull them from the product
    const p = await productsApi.get(product_id);
    let price = p.price;
    let image = p.image;
    if (variationId && p.variations?.length) {
      const v = p.variations.find(x => x.id === variationId);
      if (v) { price = v.price; image = v.image ?? image; }
    }
    const key = `guest_${product_id}_${variationId ?? 0}`;
    setCart(prev => {
      const existing = prev.items.find(i => i.key === key);
      let items: CartItem[];
      if (existing) {
        items = prev.items.map(i => i.key === key ? { ...i, qty: i.qty + qty } : i);
      } else {
        items = [...prev.items, {
          key, product_id, name: p.name, image, price, qty,
          line_total: price * qty, variation_id: variationId, variation,
        }];
      }
      const next = recompute(items);
      persistGuest(next);
      return next;
    });
  }, [persistGuest]);

  const guestUpdateQty = useCallback((key: string, qty: number) => {
    setCart(prev => {
      const items = qty <= 0
        ? prev.items.filter(i => i.key !== key)
        : prev.items.map(i => i.key === key ? { ...i, qty } : i);
      const next = recompute(items);
      persistGuest(next);
      return next;
    });
  }, [persistGuest]);

  const guestRemove = useCallback((key: string) => {
    setCart(prev => {
      const next = recompute(prev.items.filter(i => i.key !== key));
      persistGuest(next);
      return next;
    });
  }, [persistGuest]);

  const guestClear = useCallback(async () => {
    setCart(emptyCart);
    try { await AsyncStorage.removeItem(GUEST_CART_KEY); } catch {}
  }, []);

  // ── Server operations (logged-in) ────────────────────────────
  const fetchCart = useCallback(async () => {
    if (!isLoggedIn) { await loadGuestCart(); return; }
    setLoading(true);
    try {
      const data = await get<Cart>('/cart', true);
      setCart(data);
    } catch {
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, loadGuestCart]);

  const addToCart = useCallback(async (product_id: number, qty = 1, variationId?: number, variation?: Record<string, string>) => {
    setLoading(true);
    try {
      if (!isLoggedIn) { await guestAdd(product_id, qty, variationId, variation); return; }
      const body: any = { product_id, qty };
      if (variationId) { body.variation_id = variationId; body.variation = variation ?? {}; }
      const data = await post<Cart>('/cart/add', body, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, guestAdd]);

  const updateQty = useCallback(async (key: string, qty: number) => {
    if (!isLoggedIn) { guestUpdateQty(key, qty); return; }
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/update', { key, qty }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, guestUpdateQty]);

  const removeItem = useCallback(async (key: string) => {
    if (!isLoggedIn) { guestRemove(key); return; }
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/remove', { key }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, guestRemove]);

  const clearCart = useCallback(async () => {
    if (!isLoggedIn) { await guestClear(); return; }
    setLoading(true);
    try {
      await post('/cart/clear', {}, true);
      setCart(emptyCart);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, guestClear]);

  const applyCoupon = useCallback(async (code: string) => {
    if (!isLoggedIn) { throw new Error('Les codes promo nécessitent un compte.'); }
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/coupon', { code }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const removeCoupon = useCallback(async (code: string) => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await post<Cart>('/cart/coupon/remove', { code }, true);
      setCart(data);
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  // On login, merge any guest cart into the server cart, then drop the local copy.
  // On logout, fall back to the (empty or persisted) guest cart.
  useEffect(() => {
    const was = prevLoggedIn.current;
    prevLoggedIn.current = isLoggedIn;

    if (was === false && isLoggedIn) {
      (async () => {
        try {
          const raw = await AsyncStorage.getItem(GUEST_CART_KEY);
          const items: CartItem[] = raw ? JSON.parse(raw) : [];
          for (const i of items) {
            const body: any = { product_id: i.product_id, qty: i.qty };
            if (i.variation_id) { body.variation_id = i.variation_id; body.variation = i.variation ?? {}; }
            try { await post<Cart>('/cart/add', body, true); } catch {}
          }
          await AsyncStorage.removeItem(GUEST_CART_KEY);
        } catch {}
        fetchCart();
      })();
    } else {
      fetchCart();
    }
  }, [isLoggedIn, fetchCart]);

  return (
    <CartContext.Provider value={{ cart, loading, fetchCart, addToCart, updateQty, removeItem, clearCart, applyCoupon, removeCoupon, isGuest: !isLoggedIn }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart(): CartState {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error('useCart must be used within CartProvider');
  return ctx;
}
