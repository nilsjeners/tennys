import { useEffect } from 'react';
import { Tabs } from 'expo-router/js-tabs';
import { useMutation } from 'convex/react';
import { api } from '@repo/backend/convex/_generated/api';
import { TabBar } from '@/components/ui/TabBar';
import { usePushNotifications } from '@/lib/usePushNotifications';

export default function TabsLayout() {
  // Stamp lastActiveAt once when the signed-in app opens (reaching tabs means
  // authenticated + profile exists). No-op server-side if not signed in.
  const touchActive = useMutation(api.users.touchActive);
  useEffect(() => {
    touchActive().catch(() => {});
  }, [touchActive]);
  usePushNotifications();

  return (
    <Tabs tabBar={(props) => <TabBar {...props} />} screenOptions={{ headerShown: false }}>
      <Tabs.Screen name="index" />
      <Tabs.Screen name="freunde" />
      <Tabs.Screen name="rangliste" />
      <Tabs.Screen name="profil" />
    </Tabs>
  );
}
