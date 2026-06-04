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
}

export const ordersApi = {
  list: (params: { page?: number; per_page?: number; status?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    return get<{ orders: Order[]; total: number }>(`/orders?${q}`, true);
  },

  get: (id: number) => get<Order>(`/orders/${id}`, true),

  create: (data: {
    items: { product_id: number; qty: number }[];
    billing: Record<string, string>;
    shipping?: Record<string, string>;
    payment_method: string;
    notes?: string;
  }) => post<{ order: Order; message: string }>('/orders/create', data, true),

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
