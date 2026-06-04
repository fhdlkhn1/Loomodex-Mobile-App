import { get } from './client';

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
  image: string | null;
  images: string[];
  short_desc: string;
  description: string;
  sold: number;
  tags: string[];
  attributes: { name: string; values: string[] }[];
  related?: Product[];
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  per_page: number;
}

export const productsApi = {
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

  get: (id: number) => get<Product>(`/products/${id}`),

  search: (q: string) => get<ProductsResponse>(`/products/search?q=${encodeURIComponent(q)}`),

  flashDeals: () => get<{ products: Product[] }>('/products/flash-deals'),

  newArrivals: () => get<{ products: Product[] }>('/products/new-arrivals'),

  trending: () => get<{ products: Product[] }>('/products/trending'),

  featured: () => get<{ products: Product[] }>('/products/featured'),
};
