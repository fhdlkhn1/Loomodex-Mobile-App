import { get, post } from './client';

export interface Product {
  id: number;
  name: string;
  slug: string;
  price: number;
  regular_price: number;
  sale_price: number | null;
  off: number;
  currency: string;
  in_stock: boolean;
  rating: number;
  reviews: number;
  seller_id: number;
  seller: string;
  categories: number[];
  category_name?: string;
  image: string | null;
  images: string[];
  image_ids: number[];
  short_desc: string;
  description: string;
  sold: number;
  tags: string[];
  attributes: { name: string; values: string[] }[];
  /** Shipped from the USA — longer delivery, shown only in the USA Store. */
  is_usa: boolean;
  /** e.g. "10–14 jours ouvrables". Null for local products. */
  delivery_estimate: string | null;
  related?: Product[];
  /** Product video: an uploaded MP4 URL or a YouTube/Vimeo link. Null when none. */
  video?: string | null;
  /** Bulky parcel: adds the admin's bulky surcharge to delivery. */
  bulky?: boolean;
  type?: string;
  variation_attributes?: { key: string; label: string; options: string[] }[];
  variations?: { id: number; attributes: Record<string, string>; price: number; in_stock: boolean; image: string | null }[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
}

export interface ProductTabs {
  description: string;
  reviews: {
    count: number;
    average: number;
    items: { author: string; rating: number; content: string; date: string }[];
  };
  store: {
    id: number;
    name: string;
    policies: { shipping: string; refund: string; exchange: string };
  };
  more_offers: { product_id: number; store: string; price: number; in_stock: boolean }[];
  inquiries: { question: string; reply: string; customer: string; date: string }[];
}

/** One homepage banner, managed by the admin in wp-admin → Loomodex → Homepage Banners. */
export interface HomeBanner {
  image: string;
  title: string;
  /** Where a tap goes: nothing, a product (id), a category (id) or an external/website URL. */
  link_type: 'none' | 'product' | 'category' | 'url';
  link_value: string;
  /** Resolved website URL for the link (fallback for any link type). */
  url: string;
}

export const productsApi = {
  /** Up to 5 admin-managed homepage banners (empty array → app shows its built-in banner). */
  banners: () => get<{ banners: HomeBanner[] }>('/banners'),

  list: (params: {
    page?: number;
    per_page?: number;
    category?: string;
    orderby?: string;
    order?: string;
    on_sale?: boolean;
    min_price?: number;
    max_price?: number;
  } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined) q.set(k, String(v));
    });
    return get<ProductsResponse>(`/products?${q}`);
  },

  /**
   * Products imported from the USA. Deliberately its own endpoint: imported goods are
   * excluded from every other list so the local Guinea catalogue stays unmixed.
   */
  usaStore: (params: { page?: number; per_page?: number; orderby?: string } = {}) => {
    const q = new URLSearchParams();
    Object.entries(params).forEach(([k, v]) => { if (v !== undefined) q.set(k, String(v)); });
    return get<ProductsResponse & { delivery_estimate: string }>(`/products/usa-store?${q}`);
  },

  get: (id: number) => get<Product>(`/products/${id}`),

  tabs: (id: number) => get<ProductTabs>(`/products/${id}/tabs`),

  postReview: (id: number, rating: number, content: string) =>
    post<{ success: boolean; message: string }>(`/products/${id}/reviews`, { rating, content }, true),

  search: (q: string) => get<ProductsResponse>(`/products/search?q=${encodeURIComponent(q)}`),

  flashDeals: () => get<{ products: Product[] }>('/products/flash-deals'),

  newArrivals: () => get<{ products: Product[] }>('/products/new-arrivals'),

  trending: () => get<{ products: Product[] }>('/products/trending'),

  featured: () => get<{ products: Product[] }>('/products/featured'),
};
