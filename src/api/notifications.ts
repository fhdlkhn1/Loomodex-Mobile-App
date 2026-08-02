import { get, post } from './client';

/** Matches lmx_status_notification_type() / the type passed to lmx_notify_user() in the plugin. */
export type NotificationType =
  | 'order_confirmed'
  | 'order_shipped'
  | 'driver_assigned'
  | 'driver_on_way'
  | 'order_delivered'
  | 'order_status'
  | 'new_order'
  | 'vendor_new_order'
  | 'vendor_completed'
  | 'ready_dispatch'
  | 'promo'
  | 'system';

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: { order_id?: number; status?: string; [k: string]: any } | null;
  read: boolean;
  created_at: string;
}

export interface NotificationPage {
  items: AppNotification[];
  unread: number;
  total: number;
  page: number;
  has_more: boolean;
}

export const notificationsApi = {
  list: (page = 1, perPage = 20) =>
    get<NotificationPage>(`/notifications?page=${page}&per_page=${perPage}`, true),

  unreadCount: () => get<{ unread: number }>('/notifications/unread-count', true),

  markRead: (id: number) =>
    post<{ success: boolean; unread: number }>('/notifications/read', { id }, true),

  markAllRead: () =>
    post<{ success: boolean; unread: number }>('/notifications/read-all', {}, true),
};
