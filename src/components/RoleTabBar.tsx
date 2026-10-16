import React, { useEffect, useState } from 'react';
import { View, Text, Pressable, Keyboard, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CommonActions, NavigationState, Route } from '@react-navigation/native';
import { LMX, sans, mono } from '../theme';
import { Icon, IconName } from '../Icon';
import { TabBarContext } from '../components';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import { useNotifications } from '../context/NotificationsContext';
import { AppRole, appRoleFor, ROLE_HOME } from '../roles';
import { t } from '../i18n';

type Tab = { route: string; icon: IconName; label: string; badge?: 'cart' | 'notifications'; params?: object };

/** Tabs per role. Labels are French source strings, translated at render time. */
const ROLE_TABS: Record<AppRole, Tab[]> = {
  customer: [
    { route: 'Main',       icon: 'home',    label: 'Accueil' },
    { route: 'Categories', icon: 'grid',    label: 'Catégories' },
    { route: 'Cart',       icon: 'bag',     label: 'Panier', badge: 'cart' },
    { route: 'OrdersList', icon: 'package', label: 'Commandes' },
    { route: 'Account',    icon: 'user',    label: 'Compte' },
  ],
  vendor: [
    { route: 'Seller',         icon: 'storefront', label: 'Boutique' },
    { route: 'VendorOrders',   icon: 'receipt',    label: 'Commandes' },
    { route: 'VendorProducts', icon: 'tag',        label: 'Produits' },
    { route: 'Notifications',  icon: 'bell',       label: 'Notifications', badge: 'notifications' },
    { route: 'Account',        icon: 'user',       label: 'Compte' },
  ],
  driver: [
    { route: 'Driver',        icon: 'bike', label: 'Livraisons' },
    { route: 'Notifications', icon: 'bell', label: 'Notifications', badge: 'notifications' },
    { route: 'Account',       icon: 'user', label: 'Compte' },
  ],
  logistics: [
    { route: 'Logistics',          icon: 'package', label: 'Commandes' },
    { route: 'DriversMap',         icon: 'map',     label: 'Carte' },
    { route: 'LogisticsIncidents', icon: 'alert',   label: 'Incidents' },
    { route: 'Notifications',      icon: 'bell',    label: 'Notifications', badge: 'notifications' },
    { route: 'Account',            icon: 'user',    label: 'Compte' },
  ],
  partner: [
    { route: 'Partner',           icon: 'package', label: 'Commandes' },
    { route: 'PartnerDriversMap', icon: 'map',     label: 'Carte', params: { scope: 'partner' } },
    { route: 'PartnerIncidents',  icon: 'alert',   label: 'Incidents' },
    { route: 'Notifications',     icon: 'bell',    label: 'Notifications', badge: 'notifications' },
    { route: 'Account',           icon: 'user',    label: 'Compte' },
  ],
  support: [
    { route: 'CS',            icon: 'headset', label: 'Commandes' },
    { route: 'Notifications', icon: 'bell',    label: 'Notifications', badge: 'notifications' },
    { route: 'Account',       icon: 'user',    label: 'Compte' },
  ],
};

/**
 * Screens where the bar would break the flow: pre-login screens, checkout/payment
 * (they have their own sticky pay button and must not be left half-way), the
 * order-success confirmation, and the full-screen payment web view.
 */
const HIDDEN_ROUTES = new Set([
  'Splash', 'Onboarding', 'SignIn', 'SignUp', 'OTP', 'Forgot', 'Reset',
  'Checkout', 'OrderSuccess', 'WalletTopup',
]);

/** Sub-screens highlight the tab they belong to. */
const ACTIVE_ALIAS: Record<string, string> = {
  Home: 'Main',
  Search: 'Main', SearchResults: 'Main', ProductDetail: 'Main', SellerStorefront: 'Main', UsaStore: 'Main',
  Category: 'Categories',
  OrderDetails: 'OrdersList', Tracking: 'OrdersList', TrackEntry: 'OrdersList',
  AccountDetails: 'Account', Addresses: 'Account', AddressForm: 'Account', Wallet: 'Account',
  Wishlist: 'Account', ListeSouhaits: 'Account', Help: 'Account',
  VendorOrder: 'VendorOrders',
  VendorEditProduct: 'VendorProducts', AddProduct: 'VendorProducts',
  VendorStore: 'Seller',
  DriverOrder: 'Driver',
  DriverLocate: 'Logistics', LogisticsPartners: 'Logistics', PartnerLedger: 'Partner',
};

/**
 * Admins can open every dashboard, so their bar follows the section they are in
 * (the dashboard they opened from the account screen); elsewhere they shop like a customer.
 */
const ADMIN_ROUTE_ROLE: Record<string, AppRole> = {
  Seller: 'vendor', VendorOrders: 'vendor', VendorOrder: 'vendor', VendorProducts: 'vendor',
  VendorEditProduct: 'vendor', AddProduct: 'vendor', VendorStore: 'vendor',
  Driver: 'driver', DriverOrder: 'driver',
  Logistics: 'logistics', DriversMap: 'logistics', LogisticsIncidents: 'logistics',
  LogisticsPartners: 'logistics', DriverLocate: 'logistics',
  Partner: 'partner', PartnerDriversMap: 'partner', PartnerIncidents: 'partner',
  CS: 'support',
};

export function useTabRole(routeName: string): AppRole {
  const { user } = useAuth();
  const role = appRoleFor(user?.roles);
  if (role === 'customer' && user?.roles?.includes('administrator')) {
    return ADMIN_ROUTE_ROLE[routeName] ?? 'customer';
  }
  return role;
}

type StackNav = {
  getState: () => NavigationState;
  dispatch: (action: any) => void;
};

/**
 * Switch tab inside the single root stack. Tabs behave like real tabs: going to a tab
 * already in the history pops back to it; otherwise the stack becomes [home, tab] so
 * Android back always returns to the role's home. The existing home route object is
 * reused, so its screen keeps its state (scroll position, filters…).
 */
function goToTab(navigation: StackNav, target: string, home: string, params?: object) {
  const state = navigation.getState();
  const routes = state.routes as Route<string>[];
  const current = routes[state.index];
  if (current?.name === target) return;

  let idx = -1;
  for (let i = routes.length - 1; i >= 0; i--) {
    if (routes[i].name === target) { idx = i; break; }
  }
  if (idx >= 0) {
    navigation.dispatch(CommonActions.reset({ index: idx, routes: routes.slice(0, idx + 1) }));
    return;
  }

  const homeRoute = routes.find(r => r.name === home) ?? { name: home };
  const next = target === home ? [homeRoute] : [homeRoute, { name: target, params }];
  navigation.dispatch(CommonActions.reset({ index: next.length - 1, routes: next }));
}

function RoleTabBar({ role, routeName, navigation }: { role: AppRole; routeName: string; navigation: StackNav }) {
  const insets = useSafeAreaInsets();
  const { cart } = useCart();
  const { unread } = useNotifications();
  const tabs = ROLE_TABS[role];
  const activeRoute = ACTIVE_ALIAS[routeName] && tabs.some(x => x.route === ACTIVE_ALIAS[routeName])
    ? ACTIVE_ALIAS[routeName]
    : routeName;

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
      backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline,
      paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10),
    }}>
      {tabs.map(tab => {
        const active = tab.route === activeRoute;
        const badge = tab.badge === 'cart' ? (cart?.item_count ?? 0) : tab.badge === 'notifications' ? unread : 0;
        const color = active ? LMX.brand : LMX.ink50;
        return (
          <Pressable
            key={tab.route}
            accessibilityRole="tab"
            accessibilityState={{ selected: active }}
            accessibilityLabel={t(tab.label)}
            onPress={() => goToTab(navigation, tab.route, ROLE_HOME[role], tab.params)}
            style={{ flex: 1, alignItems: 'center', gap: 3, paddingVertical: 4 }}
          >
            <View>
              <Icon name={tab.icon} size={22} color={color} />
              {badge > 0 && (
                <View style={{
                  position: 'absolute', top: -4, right: -9, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4,
                  backgroundColor: tab.badge === 'notifications' ? LMX.rose : LMX.accent,
                  alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: LMX.surface,
                }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontFamily: mono(700) }}>{badge > 99 ? '99+' : badge}</Text>
                </View>
              )}
            </View>
            <Text numberOfLines={1} style={{ fontSize: 10, fontFamily: active ? sans(600) : sans(400), color }}>{t(tab.label)}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

/** Android resizes the window for the keyboard — keep the bar from riding on top of it. */
function useKeyboardOpen(): boolean {
  const [open, setOpen] = useState(false);
  useEffect(() => {
    if (Platform.OS !== 'android') return;
    const show = Keyboard.addListener('keyboardDidShow', () => setOpen(true));
    const hide = Keyboard.addListener('keyboardDidHide', () => setOpen(false));
    return () => { show.remove(); hide.remove(); };
  }, []);
  return open;
}

/**
 * Wraps every stack screen (native-stack `screenLayout`) and draws the signed-in role's
 * tab bar under it, except on the HIDDEN_ROUTES.
 */
export function RoleScreenLayout({ children, routeName, navigation }: {
  children: React.ReactNode;
  routeName: string;
  navigation: StackNav;
}) {
  const role = useTabRole(routeName);
  const keyboardOpen = useKeyboardOpen();

  if (HIDDEN_ROUTES.has(routeName)) return <>{children}</>;

  const hasNotifications = ROLE_TABS[role].some(x => x.route === 'Notifications');
  return (
    <View style={{ flex: 1, backgroundColor: LMX.bg }}>
      <TabBarContext.Provider value={{ visible: !keyboardOpen, hasNotifications }}>
        <View style={{ flex: 1 }}>{children}</View>
      </TabBarContext.Provider>
      {!keyboardOpen && <RoleTabBar role={role} routeName={routeName} navigation={navigation} />}
    </View>
  );
}
