import { get, post } from './client';
import { User } from './auth';
import { Product } from './products';

export interface Address {
  type: 'billing' | 'shipping';
  first_name: string;
  last_name: string;
  phone: string;
  address_1: string;
  address_2: string;
  city: string;
  country: string;
}

export interface ProfileStats {
  orders: number;
  wishlist: number;
  reviews: number;
}

export interface CheckoutDetails {
  first_name: string;
  last_name: string;
  email: string;
  phone: string;
  whatsapp: string;
  zone: string;
  commune: string;
  commune_name: string;
  neighborhood: string;
  landmark: string;
  language: string;
}

export interface WalletData {
  balance: number;
  currency: string;
  transactions: any[];
}

export const profileApi = {
  get: () => get<User>('/profile', true),

  update: (data: Partial<{
    first_name: string;
    last_name: string;
    display_name: string;
    billing_phone: string;
    billing_address_1: string;
    billing_city: string;
    billing_country: string;
  }>) => post<User>('/profile/update', data, true),

  changePassword: (current_password: string, new_password: string) =>
    post<{ message: string }>('/profile/change-password', { current_password, new_password }, true),

  stats: () => get<ProfileStats>('/profile/stats', true),

  checkout: () => get<CheckoutDetails>('/profile/checkout', true),

  deleteAccount: () => post<{ success: boolean; message: string }>('/profile/delete-account', {}, true),

  savePushToken: (token: string) => post<{ success: boolean }>('/profile/push-token', { token }, true),
  removePushToken: (token: string) => post<{ success: boolean }>('/profile/push-token', { token, remove: true }, true),

  wallet: () => get<WalletData>('/profile/wallet', true),

  topup: (amount: number) =>
    post<{ order_id: number; amount: number; pay_url: string }>('/wallet/topup', { amount }, true),

  getAddresses: () => get<{ addresses: Address[] }>('/profile/addresses', true),

  saveAddress: (data: Partial<Address> & { type?: 'billing' | 'shipping' }) =>
    post<{ message: string }>('/profile/addresses/save', data, true),

  getWishlist: () => get<{ products: Product[] }>('/profile/wishlist', true),

  toggleWishlist: (product_id: number) =>
    post<{ action: 'added' | 'removed'; product_id: number }>('/profile/wishlist/toggle', { product_id }, true),
};
