/**
 * Staff land directly on their own dashboard instead of the customer shop — a driver
 * opens the app and sees only their deliveries, with no shopping screens to wander into.
 * Returns the dashboard route for a set of roles, or null for regular customers.
 *
 * Kept in its own module so both navigation.tsx and the auth screens can use it without
 * an import cycle.
 */
export function staffHomeRoute(roles?: string[]): string | null {
  const r = roles ?? [];
  if (r.includes('delivery_driver'))   return 'Driver';
  if (r.includes('logistics_partner')) return 'Partner';
  if (r.includes('logistics_manager')) return 'Logistics';
  if (r.includes('customer_support'))  return 'CS';
  if (r.some(x => ['seller', 'dokandar', 'vendor', 'wcfm_vendor'].includes(x))) return 'Seller';
  return null;
}

/** Which bottom tab bar a signed-in user gets. Customers (and guests) get the shop bar. */
export type AppRole = 'customer' | 'vendor' | 'driver' | 'logistics' | 'partner' | 'support';

const HOME_ROLE: Record<string, AppRole> = {
  Driver: 'driver',
  Partner: 'partner',
  Logistics: 'logistics',
  CS: 'support',
  Seller: 'vendor',
};

/** Role from the WordPress roles — same priority as staffHomeRoute(). */
export function appRoleFor(roles?: string[]): AppRole {
  const home = staffHomeRoute(roles);
  return home ? HOME_ROLE[home] : 'customer';
}

/** The landing (first tab) route of each role. */
export const ROLE_HOME: Record<AppRole, string> = {
  customer: 'Main',
  vendor: 'Seller',
  driver: 'Driver',
  logistics: 'Logistics',
  partner: 'Partner',
  support: 'CS',
};

/**
 * Normalise the `role` sent in a notification payload (the server may send either the
 * WordPress role slug or the short recipient name) to an AppRole.
 */
export function normalizeRole(role?: string | null): AppRole | null {
  switch ((role ?? '').toLowerCase()) {
    case 'customer':          return 'customer';
    case 'store':
    case 'vendor':
    case 'seller':
    case 'wcfm_vendor':       return 'vendor';
    case 'driver':
    case 'delivery_driver':   return 'driver';
    case 'logistics':
    case 'logistics_manager': return 'logistics';
    case 'partner':
    case 'partner_manager':
    case 'logistics_partner': return 'partner';
    case 'cs':
    case 'support':
    case 'customer_support':  return 'support';
    default:                  return null;
  }
}
