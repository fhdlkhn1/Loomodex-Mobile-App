import { get, post } from './client';

export interface OrderItem {
  id: number;
  name: string;
  qty: number;
  price: number;
  total: number;
  image: string | null;
  product_id: number;
}

export interface Order {
  id: number;
  number: string;
  status: string;
  status_label: string;
  date: string;
  total: number;
  currency: string;
  items: OrderItem[];
  item_count: number;
  shipping_total: number;
  payment_method: string;
  billing: Record<string, string>;
  shipping: Record<string, string>;
  otp_code: string | null;
  tracking_url: string | null;
  driver: { id: number; name: string; phone: string } | null;
  /** When the driver collected the order — lets the vendor follow the pickup. */
  pickup_time?: string | null;
  /** True while the store still needs to verify the driver's pickup code (store view). */
  pickup_pending?: boolean;
}

export interface OrderTracking {
  order_id: number;
  number: string;
  status: string;
  status_label: string;
  active: boolean;
  driver: {
    name: string;
    phone: string;
    whatsapp: string;
    lat: number | null;
    lng: number | null;
    heading: number;
    updated: number | null;
  } | null;
  customer?: { lat: number | null; lng: number | null; updated: number | null };
  destination: {
    address: string;
    area: string;
    city: string;
    lat: number | null;
    lng: number | null;
  };
  maps_key: string;
  otp?: string | null;
}

export const ordersApi = {
  list: (params: { page?: number; per_page?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return get<{ orders: Order[]; total: number }>(`/orders?${q}`, true);
  },

  get: (id: number) => get<Order>(`/orders/${id}`, true),

  tracking: (id: number) => get<OrderTracking>(`/orders/${id}/tracking`, true),

  create: (data: {
    items: { product_id: number; qty: number }[];
    // boolean allowed for flags like recipient_same
    billing: Record<string, string | boolean>;
    shipping?: Record<string, string>;
    payment_method: string;
    notes?: string;
    region?: string;
    dest_lat?: number;
    dest_lng?: number;
  }) => post<{ order: Order; message: string; pay_url?: string }>('/orders/create', data, true),

  /** Guest checkout — order without an account (no auth token). Items come from the local cart. */
  createGuest: (data: {
    items: { product_id: number; qty: number; variation_id?: number; variation?: Record<string, string> }[];
    billing: Record<string, string | boolean>;
    payment_method: string;
    notes?: string;
    region?: string;
    dest_lat?: number;
    dest_lng?: number;
  }) => post<{ order: Order; message: string; pay_url?: string }>('/orders/create-guest', data, false),

  cancel: (id: number, reason?: string) =>
    post<{ message: string; order: Order }>(`/orders/${id}/cancel`, { reason }, true),

  track: (number: string, email?: string) => {
    const q = new URLSearchParams({ number });
    if (email) q.set('email', email);
    return get<Order>(`/orders/track?${q}`);
  },

  verifyOtp: (order_id: number, otp: string) =>
    post<{ verified: boolean; message: string }>('/otp/verify', { order_id, otp }),

  resendOtp: (order_id: number) =>
    post<{ message: string }>('/otp/resend', { order_id }, true),
};
