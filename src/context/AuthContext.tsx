import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '../api';
import { registerForPush, unregisterForPush } from '../notifications';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<User>;
  register: (data: RegisterData) => Promise<void>;
  /** Create an account from a just-placed guest order and sign in. */
  claimOrder: (orderId: number, password: string, email?: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  setUser: (user: User) => void;
  isLoggedIn: boolean;
  isVendor: boolean;
  isDriver: boolean;
  isLogistics: boolean;
  isSupport: boolean;
  isAdmin: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
  address?: string;
}

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser]     = useState<User | null>(null);
  const [token, setToken]   = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Restore session on app start
  useEffect(() => {
    (async () => {
      try {
        const stored = await AsyncStorage.getItem('lmx_token');
        if (stored) {
          setToken(stored);
          const me = await authApi.me();
          setUser(me);
          registerForPush();
        }
      } catch {
        // Token expired or invalid — clear it
        await AsyncStorage.removeItem('lmx_token');
        setToken(null);
        setUser(null);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const login = useCallback(async (email: string, password: string) => {
    const res = await authApi.login(email, password);
    await AsyncStorage.setItem('lmx_token', res.token);
    setToken(res.token);
    setUser(res.user);
    registerForPush();
    return res.user;
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    await AsyncStorage.setItem('lmx_token', res.token);
    setToken(res.token);
    setUser(res.user);
    registerForPush();
  }, []);

  const claimOrder = useCallback(async (orderId: number, password: string, email?: string) => {
    const res = await authApi.claimOrder(orderId, password, email);
    await AsyncStorage.setItem('lmx_token', res.token);
    setToken(res.token);
    setUser(res.user);
    registerForPush();
  }, []);

  const logout = useCallback(async () => {
    await unregisterForPush();
    await AsyncStorage.removeItem('lmx_token');
    setToken(null);
    setUser(null);
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const me = await authApi.me();
      setUser(me);
    } catch {}
  }, []);

  const isLoggedIn = !!user && !!token;
  const hasRole = (...roles: string[]) =>
    isLoggedIn && roles.some(r => user!.roles.includes(r));

  const isVendor   = hasRole('seller', 'dokandar', 'vendor', 'wcfm_vendor');
  const isDriver   = hasRole('delivery_driver');
  const isLogistics= hasRole('logistics_manager');
  const isSupport  = hasRole('customer_support');
  const isAdmin    = hasRole('administrator');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, claimOrder, logout, refreshUser, setUser, isLoggedIn, isVendor, isDriver, isLogistics, isSupport, isAdmin }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
