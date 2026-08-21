import { get, post } from './client';

export interface DeliveryOrder {
  id: number;
  number: string;
  status: string;
  status_label: string;
  total: number;
  formatted_total: string;
  currency: string;
  payment_method: string;
  payment: 'cod' | 'prepaid';
  item_count: number;
  items: { name: string; qty: number }[];
  customer_name: string;
  customer_phone: string;
  /** The person receiving the parcel — who the driver should call. Falls back to customer_phone. */
  recipient_phone: string;
  recipient_is_customer: boolean;
  whatsapp: string;
  /** Pickup code the driver shows/tells the store; the store enters it to release the order. */
  pickup_otp?: string | null;
  address: string;
  city: string;
  commune: string;
  zone: string;
  zone_label: string;
  neighborhood: string;
  landmark: string;
  delivery_address: string;
  pickup: { store: string; address: string };
  track_url: string;
  driver_id: number | null;
  driver_name: string | null;
  otp_status: string;
  otp_attempts: number;
  otp_code: string | null;
  assigned_time: string | null;
  pickup_time: string | null;
  arrival_time: string | null;
  delivery_time: string | null;
  date: string | null;
}

export interface DriverSummary {
  trips_today: number;
  active_count: number;
  total_delivered: number;
  failed_count: number;
  online: boolean;
}

export interface LogisticsDriver {
  id: number;
  name: string;
  phone: string;
  online: boolean;
  active_count: number;
}

export const driverApi = {
  orders: (status?: string) =>
    get<{ orders: DeliveryOrder[]; total: number }>(`/driver/orders${status ? `?status=${status}` : ''}`, true),

  summary: () => get<DriverSummary>('/driver/summary', true),

  updateStatus: (order_id: number, status: 'out-delivery' | 'driver-arrived') =>
    post<{ success: boolean; order: DeliveryOrder }>('/driver/update-status', { order_id, status }, true),

  updateLocation: (lat: number, lng: number, heading = 0) =>
    post<{ success: boolean }>('/driver/location', { lat, lng, heading }, true),

  /**
   * Mint a one-tap location-share link for the recipient. Tries the automatic SMS and
   * always returns the link + phone so the caller can send it manually if SMS is off.
   * Allowed for the assigned driver and for logistics managers.
   */
  requestLocation: (order_id: number) =>
    post<{ success: boolean; sms_sent: boolean; phone: string; url: string }>('/driver/location-request', { order_id }, true),

};

export const logisticsApi = {
  orders: (params: { status?: string; driver_id?: number } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    const qs = q.toString();
    return get<{ orders: DeliveryOrder[]; total: number }>(`/logistics/orders${qs ? `?${qs}` : ''}`, true);
  },

  stats: () => get<{ counts: { preparing: number; ready_dispatch: number; assigned: number; in_route: number; delivered_today: number; failed: number } }>('/logistics/stats', true),

  drivers: () => get<{ drivers: LogisticsDriver[] }>('/logistics/drivers', true),

  assignDriver: (order_id: number, driver_id: number) =>
    post<{ success: boolean; order: DeliveryOrder }>('/logistics/assign-driver', { order_id, driver_id }, true),

  sendOtp: (order_id: number) =>
    post<{ success: boolean; message: string; order: DeliveryOrder }>('/logistics/send-otp', { order_id }, true),

  overrideOtp: (order_id: number) =>
    post<{ success: boolean; message: string; order: DeliveryOrder }>('/logistics/override-otp', { order_id }, true),
};

export const csApi = {
  orders: (status?: string) =>
    get<{ orders: DeliveryOrder[]; total: number }>(`/cs/orders${status ? `?status=${status}` : ''}`, true),

  stats: () => get<{ counts: { awaiting: number; confirmed_today: number; rejected_today: number } }>('/cs/stats', true),

  confirmOrder: (order_id: number, note?: string) =>
    post<{ success: boolean; order: DeliveryOrder }>('/cs/confirm-order', { order_id, note }, true),

  rejectOrder: (order_id: number, reason?: string) =>
    post<{ success: boolean; order: DeliveryOrder }>('/cs/reject-order', { order_id, reason }, true),

  addNote: (order_id: number, note: string) =>
    post<{ success: boolean }>('/cs/add-note', { order_id, note }, true),
};
