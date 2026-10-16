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
  /** Logistics partner company responsible for this delivery ('' = Loomodex internal). */
  partner_id?: string;
  partner_name?: string;
  address: string;
  city: string;
  commune: string;
  zone: string;
  zone_label: string;
  neighborhood: string;
  landmark: string;
  delivery_address: string;
  /** Store to collect from. lat/lng are the store's confirmed GPS pin (null if not set yet). */
  pickup: StorePickup;
  /** Customer's profile photo (null if none) — helps the driver recognise them. */
  customer_avatar?: string | null;
  /** Customer's position: live shared location, else the saved checkout pin (null if none). */
  customer_lat?: number | null;
  customer_lng?: number | null;
  /** Saved delivery pin from checkout (null if none). */
  dest_lat?: number | null;
  dest_lng?: number | null;
  track_url: string;
  driver_id: number | null;
  driver_name: string | null;
  otp_status: string;
  otp_attempts: number;
  /** Customer's delivery code: only ever sent to Loomodex staff, never to drivers or partners. */
  otp_code: string | null;
  fee_status?: 'confirmed' | 'pending_review' | 'awaiting_customer' | 'declined';
  delivery_quote?: { lines: { key: string; label: string; amount: number }[]; total: number; distance_km: number; reliable: boolean; needs_review: boolean } | null;
  assigned_time: string | null;
  pickup_time: string | null;
  arrival_time: string | null;
  delivery_time: string | null;
  date: string | null;
}

export interface StorePickup {
  store: string;
  address: string;
  phone?: string;
  lat: number | null;
  lng: number | null;
  zone_label?: string;
  commune?: string;
  neighborhood?: string;
  landmark?: string;
}

export interface DriverSummary {
  trips_today: number;
  active_count: number;
  total_delivered: number;
  failed_count: number;
  online: boolean;
  /** Driver's own Available / Unavailable switch. Unavailable = no new assignments. */
  available: boolean;
}

export interface LogisticsDriver {
  id: number;
  name: string;
  phone: string;
  online: boolean;
  active_count: number;
  /** Driver's Available / Unavailable switch — unavailable drivers cannot be assigned. */
  available: boolean;
  /** Last known GPS position (null if the driver never shared one). */
  lat: number | null;
  lng: number | null;
  /** Unix seconds of the last GPS update. */
  loc_at: number | null;
  /** True when the last GPS update is older than 10 minutes. */
  stale: boolean;
  avatar: string | null;
  /** Number of the order the driver is currently on, if any. */
  current_order: string | null;
  /** Partner company the driver belongs to ('' = Loomodex internal). */
  partner_id?: string;
  partner_name?: string;
}

export interface LogisticsPartner {
  id: string;
  name: string;
  phone: string;
  active: boolean;
  open_orders: number;
  drivers_count: number;
  balance: number;
}

export interface Incident {
  id: number;
  order_id: number | null;
  order_number: string | null;
  partner_id: string;
  partner_name: string;
  type: 'incident' | 'unavailability';
  status: 'open' | 'resolved';
  message: string;
  created_by_name: string;
  created_at: string;
  resolved_at: string | null;
}

export interface PartnerLedger {
  collected: number;
  remitted: number;
  balance: number;
  currency: string;
  deliveries: { order_id: number; number: string; date: string; total: number; payment: 'cod' | 'prepaid'; collected: number }[];
  remittances: { id: number; date: string; amount: number; note: string; recorded_by_name: string }[];
}

export const driverApi = {
  orders: (status?: string) =>
    get<{ orders: DeliveryOrder[]; total: number }>(`/driver/orders${status ? `?status=${status}` : ''}`, true),

  summary: () => get<DriverSummary>('/driver/summary', true),

  /** Driver sets himself Available / Unavailable. */
  setAvailability: (available: boolean) =>
    post<{ success: boolean; available: boolean }>('/driver/availability', { available }, true),

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
  /** partner_id: a partner id, or 'internal' for Loomodex's own deliveries. */
  orders: (params: { status?: string; driver_id?: number; partner_id?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => v !== undefined && q.set(k, String(v)));
    const qs = q.toString();
    return get<{ orders: DeliveryOrder[]; total: number }>(`/logistics/orders${qs ? `?${qs}` : ''}`, true);
  },

  stats: () => get<{ counts: { preparing: number; ready_dispatch: number; assigned: number; in_route: number; delivered_today: number; failed: number } }>('/logistics/stats', true),

  drivers: (partner_id?: string) =>
    get<{ drivers: LogisticsDriver[] }>(`/logistics/drivers${partner_id ? `?partner_id=${encodeURIComponent(partner_id)}` : ''}`, true),

  partners: () => get<{ partners: LogisticsPartner[] }>('/logistics/partners', true),

  /** Hand an order to a partner company ('' = back to Loomodex internal). */
  assignPartner: (order_id: number, partner_id: string) =>
    post<{ success: boolean; order: DeliveryOrder }>('/logistics/assign-partner', { order_id, partner_id }, true),

  incidents: (status?: 'open' | 'resolved') =>
    get<{ incidents: Incident[] }>(`/logistics/incidents${status ? `?status=${status}` : ''}`, true),

  resolveIncident: (id: number) => post<{ success: boolean }>(`/logistics/incidents/${id}/resolve`, {}, true),

  ledger: (partner_id: string) => get<PartnerLedger>(`/logistics/ledger?partner_id=${encodeURIComponent(partner_id)}`, true),

  recordRemittance: (data: { partner_id: string; amount: number; date: string; note?: string }) =>
    post<{ success: boolean; id: number }>('/logistics/remittances', data, true),

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

  /** Keep the quoted delivery fee as is. */
  confirmFee: (order_id: number) =>
    post<{ success: boolean; order: DeliveryOrder }>('/cs/fee/confirm', { order_id }, true),

  /** Set a different delivery fee: the customer must then accept it. */
  adjustFee: (order_id: number, amount: number, reason: string) =>
    post<{ success: boolean; order: DeliveryOrder }>('/cs/fee/adjust', { order_id, amount, reason }, true),

  rejectOrder: (order_id: number, reason?: string) =>
    post<{ success: boolean; order: DeliveryOrder }>('/cs/reject-order', { order_id, reason }, true),

  addNote: (order_id: number, note: string) =>
    post<{ success: boolean }>('/cs/add-note', { order_id, note }, true),
};

/** Logistics partner manager (role logistics_partner): everything is scoped to his company server-side. */
export const partnerApi = {
  me: () => get<{ partner: { id: string; name: string; phone: string; email: string }; counts: { to_assign: number; in_progress: number; delivered_today: number; failed: number } }>('/partner/me', true),

  orders: (status: 'to_assign' | 'in_progress' | 'history' | 'failed' = 'in_progress') =>
    get<{ orders: DeliveryOrder[] }>(`/partner/orders?status=${status}`, true),

  drivers: () => get<{ drivers: LogisticsDriver[] }>('/partner/drivers', true),

  assignDriver: (order_id: number, driver_id: number) =>
    post<{ success: boolean; order: DeliveryOrder }>('/partner/assign-driver', { order_id, driver_id }, true),

  ledger: () => get<PartnerLedger>('/partner/ledger', true),

  incidents: () => get<{ incidents: Incident[] }>('/partner/incidents', true),

  reportIncident: (data: { order_id?: number; type: 'incident' | 'unavailability'; message: string }) =>
    post<{ success: boolean; incident: Incident }>('/partner/incidents', data, true),
};
