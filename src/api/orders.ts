import { get, post } from './client';
import type { DeliveryQuote } from './checkout';

/** Delivery-fee state of an order. */
export type FeeStatus = 'confirmed' | 'pending_review' | 'awaiting_customer' | 'declined';

export interface AddressChange {
  zone: string;
  commune: string;
  commune_name: string;
  neighborhood: string;
  subsector?: string;
  landmark: string;
  dest_lat?: number;
  dest_lng?: number;
  recipient_phone?: string;
}

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
  /** Delivery fee breakdown saved with the order (fixed once confirmed). */
  delivery_quote?: Pick<DeliveryQuote, 'lines' | 'total' | 'distance_km' | 'reliable' | 'needs_review'> | null;
  fee_status?: FeeStatus;
  /** Customer may still change the delivery address (before pickup). */
  can_change_address?: boolean;
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
    /** Driver's profile / vehicle photo (null if none uploaded). */
    avatar?: string | null;
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
  /** Store pickup point (null when the store has no GPS yet). */
  store?: { name: string; lat: number | null; lng: number | null; address: string } | null;
}

/**
 * Public tracking result. When `limited` is true (no/mismatched contact) the server sends a
 * privacy-safe subset: items carry only name + qty, driver only a name, billing/shipping empty.
 */
export type TrackedOrder = Omit<Order, 'items' | 'driver'> & {
  limited?: boolean;
  items: (Partial<OrderItem> & { name: string; qty: number })[];
  driver: ({ name: string } & Partial<{ id: number; phone: string; avatar: string | null }>) | null;
  tracking_steps?: { status: string; label: string; done: boolean; current: boolean }[];
  track_url?: string;
};

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
    subsector?: string;
    express?: boolean;
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
    subsector?: string;
    express?: boolean;
  }) => post<{ order: Order; message: string; pay_url?: string }>('/orders/create-guest', data, false),

  /** Customer accepts a delivery fee adjusted by customer service. */
  acceptFee: (id: number) => post<{ success: boolean; order: Order }>(`/orders/${id}/fee/accept`, {}, true),

  /** Customer refuses the adjusted fee: the order is cancelled. */
  declineFee: (id: number) => post<{ success: boolean; order: Order }>(`/orders/${id}/fee/decline`, {}, true),

  /** New quote for a different delivery address (nothing is changed yet). */
  quoteAddress: (id: number, address: AddressChange) =>
    post<DeliveryQuote>(`/orders/${id}/address/quote`, address, true),

  /** Apply the new address with its recalculated fee (customer accepted the new quote). */
  applyAddress: (id: number, address: AddressChange) =>
    post<{ success: boolean; order: Order }>(`/orders/${id}/address/apply`, { ...address, accept: true }, true),

  cancel: (id: number, reason?: string) =>
    post<{ message: string; order: Order }>(`/orders/${id}/cancel`, { reason }, true),

  /**
   * Public (no account) tracking by order number. `contact` = the order's email OR phone;
   * when it matches, the full order is returned, otherwise a privacy-safe subset.
   * A 404 ApiError (kind 'notfound') means the order genuinely doesn't exist.
   */
  track: (number: string, contact?: string) => {
    const q = new URLSearchParams({ number: number.replace(/^#/, '').trim() });
    if (contact) q.set('contact', contact.trim());
    return get<TrackedOrder>(`/orders/track?${q}`);
  },

  verifyOtp: (order_id: number, otp: string) =>
    post<{ verified: boolean; message: string }>('/otp/verify', { order_id, otp }),

  resendOtp: (order_id: number) =>
    post<{ message: string }>('/otp/resend', { order_id }, true),
};
