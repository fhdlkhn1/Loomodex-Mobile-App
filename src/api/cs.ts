import { get, post } from './client';
import { Order } from './orders';

/** Customer Service: accounts and orders by phone (client document 12 Nov 2026). */
export interface CsCustomer {
  id: number;
  name: string;
  phone: string;
  email?: string;
  address?: { zone: string; commune: string; commune_name: string; neighborhood: string; landmark: string };
}
export interface CsProduct {
  id: number; name: string; price: number; image: string | null; seller: string; seller_id: number;
  purchasable: boolean; in_stock: boolean; store: { id: number; name: string; mode: string } | null;
}
export type CsPermission = 'create_account' | 'create_order' | 'edit_order' | 'send_quotes' | 'confirm_quotes' | 'confirm_orders';

export const csApi = {
  me: () => get<{ permissions: Record<CsPermission, boolean> }>('/cs/me', true),
  findCustomers: (phone: string) => get<{ customers: CsCustomer[] }>(`/cs/customers?phone=${encodeURIComponent(phone)}`, true),
  createCustomer: (d: { first_name: string; last_name: string; phone: string; language: 'fr' | 'en'; password: string; password_confirm: string }) =>
    post<{ success: boolean; customer: CsCustomer; login: string; message: string }>('/cs/customers', d, true),
  products: (search: string) => get<{ products: CsProduct[] }>(`/cs/products?search=${encodeURIComponent(search)}`, true),
  createOrder: (d: Record<string, any>) => post<{ order: Order; message: string }>('/cs/orders', d, true),
};
