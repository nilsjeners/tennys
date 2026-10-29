import { useFonts } from 'expo-font';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { ConvexReactClient, ConvexProvider } from 'convex/react';
import { ConvexBetterAuthProvider } from '@convex-dev/better-auth/react';

import { authClient } from '@/lib/auth-client';
import { I18nProvider } from '@/lib/i18n';
import { MatchDraftProvider } from '@/lib/matchDraft';
import { ToastProvider } from '@/components/ui/Toast';
import { UpdateGate } from '@/components/UpdateGate';
import { fontMap } from '@/theme/tokens';

const convex = new ConvexReactClient(process.env.EXPO_PUBLIC_CONVEX_URL as string, {
  expectAuth: true,
  unsavedChangesWarning: false,
});

export default function RootLayout() {
  const [fontsLoaded] = useFonts(fontMap);
  if (!fontsLoaded) return null;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ConvexProvider client={convex}>
        {/* better-auth 1.6.20 / @convex-dev/better-auth 0.12.4 type drift, see upstream issues #168/#195 */}
        <ConvexBetterAuthProvider client={convex} authClient={authClient as never}>
          <SafeAreaProvider>
            <StatusBar style="light" />
            <I18nProvider>
            <UpdateGate>
            <ToastProvider>
            <MatchDraftProvider>
              <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="index" />
                <Stack.Screen name="(auth)" />
                <Stack.Screen name="(tabs)" />
                <Stack.Screen name="match-setup" />
                <Stack.Screen name="match-entry" />
                <Stack.Screen name="scan" />
                <Stack.Screen name="notifications" />
                <Stack.Screen name="match/[id]" options={{ animation: 'none' }} />
                <Stack.Screen name="player/[id]" options={{ animation: 'none' }} />
                <Stack.Screen name="team/[pair]" />
                <Stack.Screen name="legal/agb" />
                <Stack.Screen name="legal/datenschutz" />
              </Stack>
            </MatchDraftProvider>
            </ToastProvider>
            </UpdateGate>
            </I18nProvider>
          </SafeAreaProvider>
        </ConvexBetterAuthProvider>
      </ConvexProvider>
    </GestureHandlerRootView>
  );
}
