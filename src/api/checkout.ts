import { get } from './client';

export interface ZoneCommune {
  key: string;
  label: string;
  neighborhoods: string[];
}

export interface DeliveryZone {
  key: string;
  label: string;
  price: number;
  communes: ZoneCommune[];
}

export interface DeliveryZonesResponse {
  zones: DeliveryZone[];
  languages: { key: string; label: string }[];
  currency: string;
}

let cached: DeliveryZonesResponse | null = null;

export const checkoutApi = {
  zones: async (): Promise<DeliveryZonesResponse> => {
    if (cached) return cached;
    cached = await get<DeliveryZonesResponse>('/delivery-zones');
    return cached;
  },
};
