import React from 'react';
import { View, Text, Pressable, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator, BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { LMX, sans, mono } from './theme';
import { Icon, IconName } from './Icon';
import { useAuth } from './context/AuthContext';
import { useCart } from './context/CartContext';

import { ScreenSplash } from './screens/splash';
import { ScreenOnboarding, ScreenSignIn, ScreenSignUp, ScreenOTP, ScreenForgot, ScreenResetPassword } from './screens/auth';
import { ScreenHome, ScreenCategories, ScreenCategory, ScreenSearch, ScreenSearchResults } from './screens/discover';
import { ScreenFilterSheet } from './screens/filter';
import { ScreenProductDetail, ScreenSellerStorefront, ScreenCart, ScreenCheckout } from './screens/buy';
import { ScreenOrderSuccess, ScreenTracking, ScreenTrackEntry, ScreenOrdersList, ScreenOrderDetails, ScreenReturnRequest, ScreenWriteReview } from './screens/orders';
import { ScreenWishlist, ScreenListeSouhaits, ScreenAccount, ScreenNotifications, ScreenAccountDetails, ScreenAddresses, ScreenAddressForm } from './screens/account';
import { ScreenWallet, ScreenPaymentMethods } from './screens/wallet';
import { ScreenHelp, ScreenSupport, ScreenInquiries } from './screens/support';
import { ScreenSeller, ScreenAddProduct, ScreenDriver, ScreenLogistics } from './screens/business';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const TABS: { name: string; icon: IconName; label: string; push?: string }[] = [
  { name: 'Home',       icon: 'home',  label: 'Accueil' },
  { name: 'Categories', icon: 'grid',  label: 'Catégories' },
  { name: 'CartTab',    icon: 'bag',   label: 'Panier',   push: 'Cart' },
  { name: 'OrdersList', icon: 'package', label: 'Commandes', push: 'OrdersList' },
  { name: 'Account',    icon: 'user',  label: 'Compte' },
];

function LoomodexTabBar({ state, navigation }: BottomTabBarProps) {
  const insets     = useSafeAreaInsets();
  const activeName = state.routes[state.index].name;
  const { cart }   = useCart();

  return (
    <View style={{
      flexDirection: 'row', justifyContent: 'space-around', alignItems: 'flex-end',
      backgroundColor: LMX.surface, borderTopWidth: 1, borderTopColor: LMX.hairline,
      paddingTop: 8, paddingBottom: Math.max(insets.bottom, 10),
    }}>
      {TABS.map(t => {
        const isActive = !t.push && t.name === activeName;
        const badge = t.push === 'Cart' ? cart.item_count : 0;
        return (
          <Pressable
            key={t.name}
            onPress={() => (t.push ? navigation.navigate(t.push as never) : navigation.navigate(t.name as never))}
            style={{ alignItems: 'center', gap: 3, paddingHorizontal: 12, paddingVertical: 4 }}
          >
            <View>
              <Icon name={t.icon} size={22} color={isActive ? LMX.brand : LMX.ink50} />
              {badge > 0 && (
                <View style={{ position: 'absolute', top: -4, right: -7, minWidth: 16, height: 16, borderRadius: 8, paddingHorizontal: 4, backgroundColor: LMX.accent, alignItems: 'center', justifyContent: 'center', borderWidth: 1.5, borderColor: LMX.surface }}>
                  <Text style={{ color: '#fff', fontSize: 9, fontFamily: mono(700) }}>{badge}</Text>
                </View>
              )}
            </View>
            <Text style={{ fontSize: 10, fontFamily: isActive ? sans(600) : sans(400), color: isActive ? LMX.brand : LMX.ink50 }}>{t.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

function MainTabs() {
  return (
    <Tab.Navigator tabBar={(props) => <LoomodexTabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tab.Screen name="Home" component={ScreenHome} />
      <Tab.Screen name="Account" component={ScreenAccount} />
      <Tab.Screen name="Categories" component={ScreenCategories} />
      <Tab.Screen name="Support" component={ScreenSupport} />
    </Tab.Navigator>
  );
}

export function RootNavigator() {
  const { isLoggedIn, loading } = useAuth();

  if (loading) {
    return (
      <View style={{ flex: 1, backgroundColor: LMX.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={LMX.brand} />
      </View>
    );
  }

  return (
    <Stack.Navigator
      initialRouteName={isLoggedIn ? 'Main' : 'Splash'}
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: LMX.bg } }}
    >
      {/* Always available */}
      <Stack.Screen name="Splash"      component={ScreenSplash} />
      <Stack.Screen name="Onboarding"  component={ScreenOnboarding} />
      <Stack.Screen name="SignIn"      component={ScreenSignIn} />
      <Stack.Screen name="SignUp"      component={ScreenSignUp} />
      <Stack.Screen name="OTP"         component={ScreenOTP} />
      <Stack.Screen name="Forgot"      component={ScreenForgot} />
      <Stack.Screen name="Reset"       component={ScreenResetPassword} />
      <Stack.Screen name="Main"        component={MainTabs} />

      <Stack.Screen name="Search" component={ScreenSearch} />
      <Stack.Screen name="SearchResults" component={ScreenSearchResults} />
      <Stack.Screen name="Category" component={ScreenCategory} />
      <Stack.Screen name="FilterSheet" component={ScreenFilterSheet} options={{ presentation: 'transparentModal', animation: 'fade' }} />

      <Stack.Screen name="ProductDetail" component={ScreenProductDetail} />
      <Stack.Screen name="SellerStorefront" component={ScreenSellerStorefront} />
      <Stack.Screen name="Cart" component={ScreenCart} />
      <Stack.Screen name="Checkout" component={ScreenCheckout} />

      <Stack.Screen name="OrderSuccess" component={ScreenOrderSuccess} />
      <Stack.Screen name="Tracking" component={ScreenTracking} />
      <Stack.Screen name="TrackEntry" component={ScreenTrackEntry} />
      <Stack.Screen name="OrdersList" component={ScreenOrdersList} />
      <Stack.Screen name="OrderDetails" component={ScreenOrderDetails} />
      <Stack.Screen name="ReturnRequest" component={ScreenReturnRequest} />
      <Stack.Screen name="WriteReview" component={ScreenWriteReview} />

      <Stack.Screen name="Wishlist" component={ScreenWishlist} />
      <Stack.Screen name="ListeSouhaits" component={ScreenListeSouhaits} />
      <Stack.Screen name="Notifications" component={ScreenNotifications} />
      <Stack.Screen name="AccountDetails" component={ScreenAccountDetails} />
      <Stack.Screen name="Addresses" component={ScreenAddresses} />
      <Stack.Screen name="AddressForm" component={ScreenAddressForm} />

      <Stack.Screen name="Wallet" component={ScreenWallet} />
      <Stack.Screen name="PaymentMethods" component={ScreenPaymentMethods} />

      <Stack.Screen name="Help" component={ScreenHelp} />
      <Stack.Screen name="Inquiries" component={ScreenInquiries} />

      <Stack.Screen name="Seller" component={ScreenSeller} />
      <Stack.Screen name="AddProduct" component={ScreenAddProduct} />
      <Stack.Screen name="Driver" component={ScreenDriver} />
      <Stack.Screen name="Logistics" component={ScreenLogistics} />
    </Stack.Navigator>
  );
}
