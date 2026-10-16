import { get } from './api/client';
import { Order } from './api/orders';
import { driverApi, DeliveryOrder } from './api/delivery';
import { AppRole, appRoleFor, normalizeRole } from './roles';

/** Payload carried by an in-app notification row and by the push (content.data). */
export type NotificationData = {
  type?: string;
  order_id?: number | string;
  role?: string;
  [k: string]: any;
} | null | undefined;

type Nav = { navigate: (name: string, params?: object) => void };

function orderIdOf(data: NotificationData): number | null {
  const n = Number(data?.order_id);
  return Number.isFinite(n) && n > 0 ? n : null;
}

/** The store's order screen needs the full order object (it does not fetch by id). */
async function findVendorOrder(id: number): Promise<Order | null> {
  try {
    const r = await get<{ orders: Order[] }>('/vendor/orders', true);
    return (r.orders ?? []).find(o => o.id === id) ?? null;
  } catch {
    return null;
  }
}

/** Same for the driver: look through active, delivered and failed deliveries. */
async function findDriverOrder(id: number): Promise<DeliveryOrder | null> {
  for (const status of [undefined, 'history', 'failed']) {
    try {
      const r = await driverApi.orders(status);
      const hit = (r.orders ?? []).find(o => o.id === id);
      if (hit) return hit;
    } catch {}
  }
  return null;
}

/**
 * Open the screen a notification is about, for the recipient's role
 * (data.role from the server, else the signed-in user's role):
 *   customer  → OrderDetails {orderId}            (OrdersList without an order)
 *   store     → VendorOrder {order}               (VendorOrders when not found)
 *   support   → CS
 *   logistics → LogisticsIncidents for incident_*, else Logistics
 *   partner   → PartnerIncidents for incident_*, PartnerLedger for remittance_*, else Partner
 *   driver    → DriverOrder {order}               (Driver when unassigned / not found)
 */
export async function openNotificationTarget(nav: Nav, data: NotificationData, userRoles?: string[]): Promise<void> {
  const type = String(data?.type ?? '');
  let role: AppRole = normalizeRole(data?.role) ?? appRoleFor(userRoles);
  // Admins only get the in-app "new order" notice — it is about the CS review queue.
  if (!data?.role && role === 'customer' && userRoles?.includes('administrator')
      && (type === 'new_order' || type === 'order_placed')) {
    role = 'support';
  }
  const orderId = orderIdOf(data);
  const isIncident = type.startsWith('incident');

  switch (role) {
    case 'customer':
      if (orderId) nav.navigate('OrderDetails', { orderId });
      else nav.navigate('OrdersList');
      return;

    case 'vendor': {
      const order = orderId ? await findVendorOrder(orderId) : null;
      if (order) nav.navigate('VendorOrder', { order });
      else nav.navigate('VendorOrders');
      return;
    }

    case 'support':
      nav.navigate('CS');
      return;

    case 'logistics':
      nav.navigate(isIncident ? 'LogisticsIncidents' : 'Logistics');
      return;

    case 'partner':
      if (isIncident) nav.navigate('PartnerIncidents');
      else if (type.startsWith('remittance')) nav.navigate('PartnerLedger');
      else nav.navigate('Partner');
      return;

    case 'driver': {
      const gone = type === 'driver_unassigned' || type === 'partner_transferred_away';
      const order = orderId && !gone ? await findDriverOrder(orderId) : null;
      if (order) nav.navigate('DriverOrder', { order });
      else nav.navigate('Driver');
      return;
    }
  }
}
