import { useEffect, useState } from 'react';
import { Text, View } from 'react-native';
import { ConvexHttpClient } from 'convex/browser';
import Constants from 'expo-constants';

import { api } from '@repo/backend/convex/_generated/api';
import { useT } from '@/lib/i18n';
import { isOlderThan } from '@/lib/version';
import { colors, fonts } from '@/theme/tokens';

// Plain HTTP, not the reactive client: that one runs with `expectAuth: true`
// and would never answer on the signed-out screens (same reason as i18n.tsx).
const httpClient = new ConvexHttpClient(process.env.EXPO_PUBLIC_CONVEX_URL as string);

// Blocks the app when the installed version is below MIN_APP_VERSION on the
// Convex deployment. Checked once per launch; offline/errors let the app run.
export function UpdateGate({ children }: { children: React.ReactNode }) {
  const t = useT();
  const [outdated, setOutdated] = useState(false);

  useEffect(() => {
    const current = Constants.expoConfig?.version;
    httpClient
      .query(api.appConfig.minSupportedVersion, {})
      .then((min) => {
        if (min && current && isOlderThan(current, min)) setOutdated(true);
      })
      .catch(() => {});
  }, []);

  if (!outdated) return children;

  return (
    <View style={{ flex: 1, backgroundColor: colors.courtGreen, justifyContent: 'center', padding: 32, gap: 16 }}>
      <Text style={{ fontFamily: fonts.display, fontSize: 40, color: colors.lime }}>{t('update.title')}</Text>
      <Text style={{ fontFamily: fonts.sans, fontSize: 16, color: colors.white }}>{t('update.body')}</Text>
    </View>
  );
}
