import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { authApi, User } from '../api';

interface AuthState {
  user: User | null;
  token: string | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  isLoggedIn: boolean;
  isVendor: boolean;
  isDriver: boolean;
}

interface RegisterData {
  email: string;
  password: string;
  first_name: string;
  last_name: string;
  phone: string;
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
  }, []);

  const register = useCallback(async (data: RegisterData) => {
    const res = await authApi.register(data);
    await AsyncStorage.setItem('lmx_token', res.token);
    setToken(res.token);
    setUser(res.user);
  }, []);

  const logout = useCallback(async () => {
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
  const isVendor   = isLoggedIn && (user!.roles.includes('seller') || user!.roles.includes('dokandar') || user!.roles.includes('vendor'));
  const isDriver   = isLoggedIn && user!.roles.includes('delivery_driver');

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout, refreshUser, isLoggedIn, isVendor, isDriver }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth(): AuthState {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
