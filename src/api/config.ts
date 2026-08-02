import { get } from './client';

export interface AppConfig {
  google_maps_key: string;
  live_tracking: boolean;
  currency: string;
  support?: {
    whatsapp: string;
    email: string;
    help_url: string;
    contact_url: string;
    returns_url: string;
    delivery_url: string;
    tracking_url: string;
  };
}

let cached: AppConfig | null = null;

export const configApi = {
  get: async (force = false): Promise<AppConfig> => {
    if (cached && !force) return cached;
    cached = await get<AppConfig>('/config', true);
    return cached;
  },
  cached: () => cached,
};
