import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE } from './client';

// Official WCFM Marketplace REST API (wcfmmp/v1). Authenticated with the same app
// Bearer token — the plugin's determine_current_user bridge resolves the vendor.
export const WCFM_BASE = API_BASE.replace('/loomodexapp/v1', '/wcfmmp/v1');
export const SITE_ORIGIN = API_BASE.replace('/wp-json/loomodexapp/v1', '');

async function wcfmRequest<T = any>(path: string, options: RequestInit = {}): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> ?? {}),
  };
  const token = await AsyncStorage.getItem('lmx_token');
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${WCFM_BASE}${path}`, { ...options, headers });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.message || data?.code || `Error ${res.status}`);
  }
  return data;
}

export interface WcfmSalesStats {
  gross_sales: { week: number; month: number; last_month: number };
  earnings: { week: number; month: number; last_month: number };
  currency: string;
}

export interface WcfmOrder {
  id: number;
  number: string;
  status: string;
  currency: string;
  total: string;
  date_created: string;
  payment_method_title?: string;
  billing: { first_name: string; last_name: string; phone: string; email: string; address_1?: string; address_2?: string; city?: string; state?: string };
  shipping?: { first_name?: string; last_name?: string; address_1?: string; address_2?: string; city?: string; state?: string };
  line_items: { id: number; name: string; quantity: number; total: string; sku?: string }[];
}

export interface WcfmNotification {
  id?: number;
  message?: string;
  text?: string;
  url?: string;
  read?: number | boolean;
  time?: string;
}

const qs = (params: Record<string, any>) => {
  const q = new URLSearchParams();
  Object.entries(params).forEach(([k, v]) => v !== undefined && v !== '' && q.set(k, String(v)));
  const s = q.toString();
  return s ? `?${s}` : '';
};

// Upload a local image via OUR plugin endpoint (authenticated by the app JWT through
// lmx_authenticate — no dependency on the global-user bridge). Returns attachment id.
export async function uploadMedia(uri: string, filename = `photo-${Date.now()}.jpg`): Promise<number> {
  const token = await AsyncStorage.getItem('lmx_token');
  const ext = (filename.split('.').pop() || 'jpg').toLowerCase();
  const mime = ext === 'png' ? 'image/png' : ext === 'webp' ? 'image/webp' : 'image/jpeg';
  const form = new FormData();
  // @ts-ignore — React Native FormData file shape
  form.append('file', { uri, name: filename, type: mime });

  const res = await fetch(`${API_BASE}/vendor/upload-image`, {
    method: 'POST',
    headers: { Authorization: token ? `Bearer ${token}` : '' },
    body: form,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Échec du téléversement de l\'image.');
  return data.id as number;
}

export const wcfmApi = {
  salesStats: () => wcfmRequest<WcfmSalesStats>('/sales-stats'),

  orders: (params: { status?: string; per_page?: number; page?: number } = {}) =>
    wcfmRequest<WcfmOrder[]>(`/orders${qs({ per_page: 20, ...params })}`),

  order: (id: number) => wcfmRequest<WcfmOrder>(`/orders/${id}`),

  updateOrderStatus: (id: number, status: string) =>
    wcfmRequest(`/orders/${id}`, { method: 'PUT', body: JSON.stringify({ status }) }),

  products: (params: { per_page?: number; page?: number } = {}) =>
    wcfmRequest<any[]>(`/products${qs({ per_page: 50, ...params })}`),

  notifications: () => wcfmRequest<WcfmNotification[]>('/notifications').catch(() => [] as WcfmNotification[]),
};
