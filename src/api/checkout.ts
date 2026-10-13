import { get, post } from './client';

export interface QuoteLine {
  key: 'base' | 'distance' | 'access' | 'express' | 'bulky' | 'multi_store' | 'zone' | string;
  label: string;
  amount: number;
}

/** Server-calculated delivery fee (never computed on the device). */
export interface DeliveryQuote {
  mode: 'distance' | 'zone';
  total: number;
  currency: string;
  /** False when the distance had to be estimated (no store GPS / no reference point / distance service down). */
  reliable: boolean;
  /** True: customer service confirms the fee before the order goes ahead. */
  needs_review: boolean;
  lines: QuoteLine[];
  distance_km: number;
  distance_source: 'google' | 'straight' | 'none';
  access_level: AccessLevel;
  destination_source: 'gps' | 'subsector' | 'neighborhood' | 'none';
  stores: { vendor_id: number; name: string; lat: number | null; lng: number | null; distance_km: number }[];
  /** Express option as configured by the admin (shown at checkout when enabled). */
  express_option?: { enabled: boolean; fee: number; label: string };
}

export interface QuoteRequest {
  items?: { product_id: number; qty: number }[];
  zone: string;
  commune: string;
  neighborhood: string;
  subsector?: string;
  dest_lat?: number;
  dest_lng?: number;
  express?: boolean;
}

export type AccessLevel = 'normal' | 'difficult' | 'very_difficult';

export interface AreaSubsector {
  key: string;
  name: string;
  access: AccessLevel;
  has_point: boolean;
}

/** A neighborhood with its pricing data (reference point / access level / optional sub-sectors). */
export interface NeighborhoodArea {
  name: string;
  access: AccessLevel;
  has_point: boolean;
  subsectors: AreaSubsector[];
}

export interface ZoneCommune {
  key: string;
  label: string;
  neighborhoods: string[];
  /** Same neighborhoods as `neighborhoods`, with access level + sub-sectors (may be absent on older servers). */
  areas?: NeighborhoodArea[];
}

export interface DeliveryZone {
  key: string;
  label: string;
  price: number;
  communes: ZoneCommune[];
}

export interface DeliveryZonesResponse {
  zones: DeliveryZone[];
  /** 'zone' = legacy fixed zone price; 'distance' = base + km + access + options. */
  pricing_mode?: 'zone' | 'distance';
  languages: { key: string; label: string }[];
  currency: string;
}

// Areas and fees are edited by the admin (wp-admin → Loomodex → Delivery Areas), so the
// cache is short-lived: a change shows up in the app within 10 minutes without a release.
const ZONES_TTL_MS = 10 * 60 * 1000;
let cached: DeliveryZonesResponse | null = null;
let cachedAt = 0;

export const checkoutApi = {
  zones: async (force = false): Promise<DeliveryZonesResponse> => {
    if (cached && !force && Date.now() - cachedAt < ZONES_TTL_MS) return cached;
    cached = await get<DeliveryZonesResponse>('/delivery-zones');
    cachedAt = Date.now();
    return cached;
  },

  /** Live delivery-fee quote with full breakdown (auth optional; uses the server cart when items are omitted). */
  quote: (req: QuoteRequest) => post<DeliveryQuote>('/delivery/quote', req, true),
};
