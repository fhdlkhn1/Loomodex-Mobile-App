import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as Device from 'expo-device';
import type * as NotificationsModule from 'expo-notifications';
import { profileApi } from './api/profile';

// Expo Go (SDK 53+) doesn't support remote push and expo-notifications errors as soon as it
// is loaded there — so it is only required outside Expo Go. Never let any of this crash startup.
export const isExpoGo = Constants.executionEnvironment === 'storeClient';

let mod: typeof NotificationsModule | null = null;
if (!isExpoGo) {
  try { mod = require('expo-notifications'); } catch { mod = null; }
}
/** expo-notifications, or null in Expo Go / when the native module is missing. */
export const Notifications = mod;

// Show notifications while the app is foregrounded (guarded — never throws at import)
try {
  if (Notifications) {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList: true,
        shouldPlaySound: true,
        shouldSetBadge: false,
      }),
    });
  }
} catch {}

const projectId = (Constants.expoConfig as any)?.extra?.eas?.projectId
  ?? (Constants as any)?.easConfig?.projectId;

async function getToken(): Promise<string | null> {
  if (!Notifications) return null;
  try {
    const res = await Notifications.getExpoPushTokenAsync(projectId ? { projectId } : undefined);
    return res.data ?? null;
  } catch {
    return null;
  }
}

/** Ask permission, get the Expo push token, register it with the backend. Always safe. */
export async function registerForPush(): Promise<void> {
  if (!Notifications) return;      // push not available in Expo Go
  try {
    if (!Device.isDevice) return;  // simulators can't get a push token

    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Notifications',
        importance: Notifications.AndroidImportance.HIGH,
        vibrationPattern: [0, 250, 250, 250],
        lightColor: '#1E6BFF',
      });
    }

    const existing = await Notifications.getPermissionsAsync();
    let status = existing.status;
    if (status !== 'granted') {
      status = (await Notifications.requestPermissionsAsync()).status;
    }
    if (status !== 'granted') return;

    const token = await getToken();
    if (token) await profileApi.savePushToken(token);
  } catch {}
}

/** Remove this device's token from the backend (call before logout). Always safe. */
export async function unregisterForPush(): Promise<void> {
  if (!Notifications) return;
  try {
    const token = await getToken();
    if (token) await profileApi.removePushToken(token);
  } catch {}
}
