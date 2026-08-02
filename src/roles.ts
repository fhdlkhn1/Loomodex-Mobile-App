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
  if (r.includes('logistics_manager')) return 'Logistics';
  if (r.includes('customer_support'))  return 'CS';
  if (r.some(x => ['seller', 'dokandar', 'vendor', 'wcfm_vendor'].includes(x))) return 'Seller';
  return null;
}
