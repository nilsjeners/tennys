import { useEffect } from 'react';
import * as Device from 'expo-device';
import Constants from 'expo-constants';
import { useMutation } from 'convex/react';
import { api } from '@repo/backend/convex/_generated/api';
import { Platform } from 'react-native';

// Requests permission (if needed) and registers the Expo push token with the
// backend. No-op on web/SSR and simulators (Device.isDevice is false there).
// expo-notifications is dynamically imported so it's never touched during
// web/SSR rendering — its module-level code throws there (no localStorage).
// Mount once in an authenticated layout.
export function usePushNotifications() {
  const registerPushToken = useMutation(api.notifications.registerPushToken);

  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    (async () => {
      const Notifications = await import('expo-notifications');
      const { status: existing } = await Notifications.getPermissionsAsync();
      let status = existing;
      if (status !== 'granted') {
        const req = await Notifications.requestPermissionsAsync();
        status = req.status;
      }
      if (status !== 'granted') return;
      const projectId = Constants.expoConfig?.extra?.eas?.projectId;
      const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
      await registerPushToken({ token, platform: Platform.OS });
    })().catch(() => {});
  }, [registerPushToken]);
}
