import { get, post, uploadFile } from './client';

/** Store address + GPS pin — same Zone → Commune → Quartier → Landmark structure as checkout. */
export interface StoreLocation {
  zone: string;
  zone_label: string;
  commune: string;
  commune_name: string;
  neighborhood: string;
  landmark: string;
  lat: number | null;
  lng: number | null;
  /** Human-readable one-line address. */
  address: string;
}

export interface VendorStore {
  name: string;
  shipping_policy: string;
  refund_policy: string;
  location: StoreLocation;
}

export interface EarningsSplit {
  /** Delivered (and therefore paid) orders only. */
  confirmed: number;
  /** Orders still in progress — not yet earned. */
  pending: number;
}

export interface VendorDashboard {
  earnings: { week: EarningsSplit; month: EarningsSplit };
  gross_sales: { week: number; month: number };
  currency: string;
  total_products: number;
  total_orders: number;
  new_orders: number;
  recent_orders: any[];
}

export const MAX_PRODUCT_PHOTOS = 10;

export const vendorApi = {
  dashboard: () => get<VendorDashboard>('/vendor/dashboard', true),

  store: () => get<VendorStore>('/vendor/store', true),

  updateStore: (data: Partial<{
    shipping_policy: string;
    refund_policy: string;
    zone: string;
    commune: string;
    commune_name: string;
    neighborhood: string;
    landmark: string;
    lat: number | null;
    lng: number | null;
  }>) => post<{ success: boolean; message: string; location: StoreLocation }>('/vendor/store/update', data, true),

  /** Upload a product image or video (≤ 50 MB). */
  uploadMedia: (uri: string, opts: { name?: string; type?: string } = {}) =>
    uploadFile<{ id: number; url: string; type: 'image' | 'video' }>('/vendor/upload-media', uri, opts),
};
