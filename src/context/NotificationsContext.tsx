import React, { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import * as Notifications from 'expo-notifications';
import { notificationsApi, AppNotification } from '../api/notifications';
import { useAuth } from './AuthContext';

interface NotificationsState {
  items: AppNotification[];
  unread: number;
  loading: boolean;
  hasMore: boolean;
  /** Reload the first page + unread count. */
  refresh: () => Promise<void>;
  /** Append the next page (pagination on the inbox screen). */
  loadMore: () => Promise<void>;
  /** Cheap poll — unread count only, no list payload. */
  refreshCount: () => Promise<void>;
  markRead: (id: number) => Promise<void>;
  markAllRead: () => Promise<void>;
}

const NotificationsContext = createContext<NotificationsState | null>(null);

export function NotificationsProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();
  const [items, setItems]     = useState<AppNotification[]>([]);
  const [unread, setUnread]   = useState(0);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const page = useRef(1);

  const refresh = useCallback(async () => {
    if (!isLoggedIn) return;
    setLoading(true);
    try {
      const data = await notificationsApi.list(1, 20);
      setItems(data.items);
      setUnread(data.unread);
      setHasMore(data.has_more);
      page.current = 1;
    } catch {
      // Offline / server error — keep whatever is on screen rather than blanking it
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn]);

  const loadMore = useCallback(async () => {
    if (!isLoggedIn || loading || !hasMore) return;
    setLoading(true);
    try {
      const next = page.current + 1;
      const data = await notificationsApi.list(next, 20);
      setItems(prev => [...prev, ...data.items]);
      setUnread(data.unread);
      setHasMore(data.has_more);
      page.current = next;
    } catch {
    } finally {
      setLoading(false);
    }
  }, [isLoggedIn, loading, hasMore]);

  const refreshCount = useCallback(async () => {
    if (!isLoggedIn) return;
    try {
      const { unread } = await notificationsApi.unreadCount();
      setUnread(unread);
    } catch {}
  }, [isLoggedIn]);

  const markRead = useCallback(async (id: number) => {
    // Optimistic — the badge should react instantly, the server is the backstop
    setItems(prev => prev.map(n => (n.id === id ? { ...n, read: true } : n)));
    setUnread(prev => Math.max(0, prev - 1));
    try {
      const { unread } = await notificationsApi.markRead(id);
      setUnread(unread);
    } catch {}
  }, []);

  const markAllRead = useCallback(async () => {
    setItems(prev => prev.map(n => ({ ...n, read: true })));
    setUnread(0);
    try {
      await notificationsApi.markAllRead();
    } catch {}
  }, []);

  // Load on login; clear on logout so a signed-out user never keeps a stale badge
  useEffect(() => {
    if (isLoggedIn) {
      refresh();
    } else {
      setItems([]);
      setUnread(0);
      setHasMore(false);
      page.current = 1;
    }
  }, [isLoggedIn, refresh]);

  // Re-check when the app comes back to the foreground
  useEffect(() => {
    const sub = AppState.addEventListener('change', (s: AppStateStatus) => {
      if (s === 'active') refreshCount();
    });
    return () => sub.remove();
  }, [refreshCount]);

  // A push landing while the app is open should light the badge immediately.
  // Guarded: the native module is absent in Expo Go.
  useEffect(() => {
    let sub: any;
    try {
      sub = Notifications.addNotificationReceivedListener(() => { refreshCount(); });
    } catch {}
    return () => { try { sub?.remove(); } catch {} };
  }, [refreshCount]);

  return (
    <NotificationsContext.Provider
      value={{ items, unread, loading, hasMore, refresh, loadMore, refreshCount, markRead, markAllRead }}
    >
      {children}
    </NotificationsContext.Provider>
  );
}

export function useNotifications(): NotificationsState {
  const ctx = useContext(NotificationsContext);
  if (!ctx) throw new Error('useNotifications must be used within NotificationsProvider');
  return ctx;
}
