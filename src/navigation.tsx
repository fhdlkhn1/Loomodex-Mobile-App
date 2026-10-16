import React, { useEffect, useRef } from 'react';
import { View, ActivityIndicator } from 'react-native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { useNavigation } from '@react-navigation/native';
import { LMX } from './theme';
import { useAuth } from './context/AuthContext';
import { useNotifications } from './context/NotificationsContext';
import { staffHomeRoute } from './roles';
import { Notifications } from './notifications';
import { openNotificationTarget } from './notificationRouting';
import { RoleScreenLayout } from './components/RoleTabBar';

import { ScreenSplash } from './screens/splash';
import { ScreenOnboarding, ScreenSignIn, ScreenSignUp, ScreenOTP, ScreenForgot, ScreenResetPassword } from './screens/auth';
import { ScreenHome, ScreenCategories, ScreenCategory, ScreenSearch, ScreenSearchResults } from './screens/discover';
import { ScreenProductDetail, ScreenSellerStorefront, ScreenCart, ScreenCheckout } from './screens/buy';
import { ScreenOrderSuccess, ScreenTracking, ScreenTrackEntry, ScreenOrdersList, ScreenOrderDetails } from './screens/orders';
import { ScreenWishlist, ScreenListeSouhaits, ScreenAccount, ScreenAccountDetails, ScreenAddresses, ScreenAddressForm } from './screens/account';
import { ScreenPartner, ScreenPartnerIncidents, ScreenPartnerLedger, ScreenLogisticsIncidents, ScreenLogisticsPartners } from './screens/partner';
import { ScreenWallet, ScreenWalletTopup } from './screens/wallet';
import { ScreenHelp } from './screens/support';
import { ScreenNotifications } from './screens/notifications';
import { ScreenUsaStore } from './screens/usastore';
import { ScreenSeller, ScreenAddProduct, ScreenDriver, ScreenDriverOrder, ScreenLogistics, ScreenCS, ScreenVendorProducts, ScreenVendorEditProduct, ScreenVendorOrders, ScreenVendorOrder, ScreenVendorStore, ScreenDriverLocate, ScreenDriversMap } from './screens/business';

const Stack = createNativeStackNavigator();

/**
 * Tapping a push opens the screen it is about (same routing as the in-app inbox).
 * Covers taps while the app runs and the tap that cold-started the app. Guarded:
 * expo-notifications is null in Expo Go.
 */
function PushResponseHandler() {
  const nav = useNavigation<any>();
  const { isLoggedIn, user } = useAuth();
  const { refresh } = useNotifications();
  const handled = useRef<Set<string>>(new Set());
  const roles = useRef<string[] | undefined>(user?.roles);
  roles.current = user?.roles;

  useEffect(() => {
    if (!Notifications || !isLoggedIn) return;
    const mod = Notifications;

    const handle = (response: any) => {
      try {
        const id: string = response?.notification?.request?.identifier ?? '';
        if (id && handled.current.has(id)) return;
        if (id) handled.current.add(id);
        const data = response?.notification?.request?.content?.data ?? null;
        refresh();
        const go = () => { openNotificationTarget(nav, data, roles.current).catch(() => {}); };
        // On a cold start the navigator may still be mounting its first screen.
        if (typeof nav.isReady === 'function' && !nav.isReady()) setTimeout(go, 600);
        else go();
      } catch {}
    };

    let sub: any;
    try {
      sub = mod.addNotificationResponseReceivedListener(handle);
      mod.getLastNotificationResponseAsync()
        .then(r => { if (r) { handle(r); mod.clearLastNotificationResponseAsync().catch(() => {}); } })
        .catch(() => {});
    } catch {}
    return () => { try { sub?.remove(); } catch {} };
  }, [isLoggedIn, nav, refresh]);

  return null;
}

export function RootNavigator() {
  const { isLoggedIn, user, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: LMX.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={LMX.brand} />
      </View>
    );
  }

  // On launch: customers → shop; staff → straight to their dashboard (so a driver never
  // reopens the app onto the shopping home and gets lost).
  const initialRoute = !isLoggedIn ? 'Splash' : (staffHomeRoute(user?.roles) ?? 'Main');

  return (
    <>
    <PushResponseHandler />
    <Stack.Navigator
      initialRouteName={initialRoute}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: LMX.bg } }}
      screenLayout={({ children, route, navigation }) => (
        <RoleScreenLayout routeName={route.name} navigation={navigation as any}>{children}</RoleScreenLayout>
      )}
    >
      {/* Always available */}
      <Stack.Screen name="Splash"      component={ScreenSplash} />
      <Stack.Screen name="Onboarding"  component={ScreenOnboarding} />
      <Stack.Screen name="SignIn"      component={ScreenSignIn} />
      <Stack.Screen name="SignUp"      component={ScreenSignUp} />
      <Stack.Screen name="OTP"         component={ScreenOTP} />
      <Stack.Screen name="Forgot"      component={ScreenForgot} />
      <Stack.Screen name="Reset"       component={ScreenResetPassword} />
      {/* Customer home tabs — plain stack screens; the role tab bar is drawn by RoleScreenLayout */}
      <Stack.Screen name="Main"        component={ScreenHome} />
      <Stack.Screen name="Categories"  component={ScreenCategories} />
      <Stack.Screen name="Account"     component={ScreenAccount} />

      <Stack.Screen name="Search" component={ScreenSearch} />
      <Stack.Screen name="SearchResults" component={ScreenSearchResults} />
      <Stack.Screen name="Category" component={ScreenCategory} />

      <Stack.Screen name="ProductDetail" component={ScreenProductDetail} />
      <Stack.Screen name="SellerStorefront" component={ScreenSellerStorefront} />
      <Stack.Screen name="Cart" component={ScreenCart} />
      <Stack.Screen name="Checkout" component={ScreenCheckout} />

      <Stack.Screen name="OrderSuccess" component={ScreenOrderSuccess} />
      <Stack.Screen name="Tracking" component={ScreenTracking} />
      <Stack.Screen name="TrackEntry" component={ScreenTrackEntry} />
      <Stack.Screen name="OrdersList" component={ScreenOrdersList} />
      <Stack.Screen name="OrderDetails" component={ScreenOrderDetails} />

      <Stack.Screen name="Wishlist" component={ScreenWishlist} />
      <Stack.Screen name="ListeSouhaits" component={ScreenListeSouhaits} />
      <Stack.Screen name="AccountDetails" component={ScreenAccountDetails} />
      <Stack.Screen name="Addresses" component={ScreenAddresses} />
      <Stack.Screen name="AddressForm" component={ScreenAddressForm} />
      <Stack.Screen name="Wallet" component={ScreenWallet} />
      <Stack.Screen name="WalletTopup" component={ScreenWalletTopup} />

      <Stack.Screen name="Help" component={ScreenHelp} />
      <Stack.Screen name="Notifications" component={ScreenNotifications} />
      <Stack.Screen name="UsaStore" component={ScreenUsaStore} />

      <Stack.Screen name="Seller" component={ScreenSeller} />
      <Stack.Screen name="AddProduct" component={ScreenAddProduct} />
      <Stack.Screen name="VendorProducts" component={ScreenVendorProducts} />
      <Stack.Screen name="VendorEditProduct" component={ScreenVendorEditProduct} />
      <Stack.Screen name="VendorOrders" component={ScreenVendorOrders} />
      <Stack.Screen name="VendorOrder" component={ScreenVendorOrder} />
      <Stack.Screen name="VendorStore" component={ScreenVendorStore} />
      <Stack.Screen name="Driver" component={ScreenDriver} />
      <Stack.Screen name="DriverOrder" component={ScreenDriverOrder} />
      <Stack.Screen name="Logistics" component={ScreenLogistics} />
      <Stack.Screen name="DriverLocate" component={ScreenDriverLocate} />
      <Stack.Screen name="DriversMap" component={ScreenDriversMap} />
      <Stack.Screen name="CS" component={ScreenCS} />
      <Stack.Screen name="LogisticsIncidents" component={ScreenLogisticsIncidents} />
      <Stack.Screen name="LogisticsPartners" component={ScreenLogisticsPartners} />
      <Stack.Screen name="Partner" component={ScreenPartner} />
      <Stack.Screen name="PartnerIncidents" component={ScreenPartnerIncidents} />
      <Stack.Screen name="PartnerLedger" component={ScreenPartnerLedger} />
      <Stack.Screen name="PartnerDriversMap" component={ScreenDriversMap} initialParams={{ scope: 'partner' }} />
    </Stack.Navigator>
    </>
  );
}
