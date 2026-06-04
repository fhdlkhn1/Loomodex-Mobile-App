import { post, get } from './client';

export interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  username: string;
  phone: string;
  roles: string[];
  avatar: string;
  wallet: number;
  store: null | {
    name: string;
    logo: string | null;
    banner: string | null;
    slug: string;
  };
}

export interface AuthResponse {
  token: string;
  user: User;
}

export const authApi = {
  login: (email: string, password: string) =>
    post<AuthResponse>('/auth/login', { email, password }),

  register: (data: {
    email: string;
    password: string;
    first_name: string;
    last_name: string;
    phone: string;
  }) => post<AuthResponse>('/auth/register', data),

  me: () => get<User>('/auth/me', true),

  refresh: () => post<AuthResponse>('/auth/refresh', {}, true),

  forgotPassword: (email: string) =>
    post<{ message: string }>('/auth/forgot-password', { email }),

  resetPassword: (email: string, code: string, password: string) =>
    post<{ message: string }>('/auth/reset-password', { email, code, password }),
};
