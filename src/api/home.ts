import { get } from './client';
import { Product } from './products';

/** wp-admin → Loomodex → Home page, resolved by the server (GET /home/layout). */
export interface HomeLink { type: 'none' | 'category' | 'product' | 'store' | 'url' | 'screen'; value: string; url: string; name?: string }
export interface HomeSection {
  id: string;
  type: 'trust' | 'flash' | 'ad' | 'categories' | 'collection' | 'rail' | 'guide' | 'support';
  title: string;
  link_label?: string;
  link?: HomeLink;
  image?: string | null;
  text?: string;
  button?: string;
  style?: 'dark' | 'light' | 'photo' | 'image';
  ends_at?: string;
  products?: Product[];
  items?: any[];
  panels?: { title: string; image: string | null; products: Product[]; link?: HomeLink }[];
  steps?: { title: string; text: string }[];
}
export interface HomeLayout {
  card: { verified_label: string; delivery_text: string; pay_text: string; fee_text: string };
  sections: HomeSection[];
  version: number;
}

export const homeApi = {
  layout: () => get<HomeLayout>('/home/layout'),
};
