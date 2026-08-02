import 'react-native-gesture-handler';
import React, { useCallback, useEffect } from 'react';
import { View, Text } from 'react-native';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { NavigationContainer, DefaultTheme } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import {
  useFonts,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
} from '@expo-google-fonts/inter';
import { QueryClientProvider } from '@tanstack/react-query';
import { RootNavigator } from './src/navigation';
import { LMX } from './src/theme';
import { queryClient } from './src/queryClient';
import { AuthProvider } from './src/context/AuthContext';
import { CartProvider } from './src/context/CartContext';
import { NotificationsProvider } from './src/context/NotificationsContext';

SplashScreen.preventAutoHideAsync().catch(() => {});

const navTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: LMX.bg,
    card: LMX.surface,
    text: LMX.ink,
    primary: LMX.brand,
    border: LMX.hairline,
  },
};

// Catches render/runtime crashes so the app never gets stuck on the splash logo
class AppErrorBoundary extends React.Component<{ children: React.ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null };
  static getDerivedStateFromError(error: Error) { return { error }; }
  componentDidCatch() { SplashScreen.hideAsync().catch(() => {}); }
  render() {
    if (this.state.error) {
      return (
        <View style={{ flex: 1, backgroundColor: LMX.bg, alignItems: 'center', justifyContent: 'center', padding: 28, gap: 10 }}>
          <Text style={{ fontSize: 16, fontWeight: '700', color: LMX.ink, textAlign: 'center' }}>Une erreur est survenue</Text>
          <Text style={{ fontSize: 13, color: LMX.ink70, textAlign: 'center' }}>Veuillez fermer puis rouvrir l'application.</Text>
        </View>
      );
    }
    return this.props.children as any;
  }
}

export default function App() {
  const [loaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
  });

  // Safety net: never leave the native splash up forever, even if something hangs
  useEffect(() => {
    if (loaded) SplashScreen.hideAsync().catch(() => {});
    const t = setTimeout(() => SplashScreen.hideAsync().catch(() => {}), 4000);
    return () => clearTimeout(t);
  }, [loaded]);

  const onReady = useCallback(() => { SplashScreen.hideAsync().catch(() => {}); }, []);

  if (!loaded) return <View style={{ flex: 1, backgroundColor: LMX.bg }} />;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <AppErrorBoundary>
          <QueryClientProvider client={queryClient}>
            <AuthProvider>
              <CartProvider>
                <NotificationsProvider>
                  <NavigationContainer theme={navTheme} onReady={onReady}>
                    <StatusBar style="dark" />
                    <RootNavigator />
                  </NavigationContainer>
                </NotificationsProvider>
              </CartProvider>
            </AuthProvider>
          </QueryClientProvider>
        </AppErrorBoundary>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
