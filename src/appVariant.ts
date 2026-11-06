import Constants from 'expo-constants';

/**
 * Which store app this build is (see app.config.js):
 *  - 'customer' → Loomodex: customers, sellers, customer service
 *  - 'drivers'  → Loomodex Drivers: drivers, logistics managers, logistics partner managers
 */
export type AppVariant = 'customer' | 'drivers';

export const APP_VARIANT: AppVariant =
  (Constants.expoConfig as any)?.extra?.appVariant === 'drivers' ? 'drivers' : 'customer';
export const IS_DRIVERS_APP = APP_VARIANT === 'drivers';
export const APP_NAME = IS_DRIVERS_APP ? 'Loomodex Drivers' : 'Loomodex';

/** WordPress roles that work in Loomodex Drivers. */
export const DELIVERY_STAFF_ROLES = ['delivery_driver', 'logistics_manager', 'logistics_partner'];

/**
 * While Loomodex Drivers is not yet live on the stores, the customer app keeps the delivery
 * staff roles so drivers and logistics are never left without an app. Set to `false` and
 * publish the customer app once Loomodex Drivers is approved on Google Play and the App Store.
 */
export const STAFF_IN_CUSTOMER_APP = true;

export function isDeliveryStaff(roles?: string[]): boolean {
  return (roles ?? []).some(r => DELIVERY_STAFF_ROLES.includes(r));
}

/** Can an account with these roles use this app? */
export function roleAllowedInThisApp(roles?: string[]): boolean {
  if (IS_DRIVERS_APP) return isDeliveryStaff(roles);
  return STAFF_IN_CUSTOMER_APP || !isDeliveryStaff(roles);
}
