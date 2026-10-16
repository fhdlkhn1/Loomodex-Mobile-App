import { get, post } from './client';

/**
 * Event types sent by the plugin (notification-events.php catalogue), plus the older
 * status-based types still present in users' history. Unknown future types are allowed.
 */
export type NotificationEvent =
  | 'order_placed' | 'fee_review_needed' | 'fee_adjusted' | 'fee_accepted' | 'fee_declined'
  | 'order_confirmed' | 'order_rejected' | 'partner_assigned' | 'partner_transferred_away'
  | 'driver_assigned' | 'driver_unassigned' | 'picked_up' | 'driver_arrived' | 'delivered'
  | 'delivery_failed' | 'address_changed' | 'incident_reported' | 'incident_resolved'
  | 'remittance_recorded' | 'order_cancelled'
  // legacy
  | 'order_shipped' | 'driver_on_way' | 'order_delivered' | 'order_status' | 'new_order'
  | 'vendor_new_order' | 'vendor_completed' | 'ready_dispatch' | 'promo' | 'system';

export type NotificationType = NotificationEvent | (string & {});

export interface AppNotification {
  id: number;
  type: NotificationType;
  title: string;
  body: string;
  data: { type?: string; order_id?: number | string; role?: string; status?: string; [k: string]: any } | null;
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
