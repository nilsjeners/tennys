import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';

import { authClient } from '@/lib/auth-client';
import { fontMap } from '@/theme/tokens';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL as string, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  if (!fontsLoaded) return null;

  return (
    <ConvexProvider client={convex}>
      {/* better-auth 1.6.20 / @convex-dev/better-auth 0.12.4 type drift, see upstream issues #168/#195 */}
      <ConvexBetterAuthProvider client={convex} authClient={authClient as never}>
        <SafeAreaProvider>
          <StatusBar style="light" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="index" />
            <Stack.Screen name="(auth)" />
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="match-create" options={{ presentation: 'modal' }} />
          </Stack>
        </SafeAreaProvider>
      </ConvexBetterAuthProvider>
    </ConvexProvider>
  );
}
