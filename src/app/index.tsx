import { Redirect } from 'expo-router';
import { useConvexAuth, useQuery } from 'convex/react';
import { View } from 'react-native';

import { api } from '@convex/_generated/api';
import { colors } from '@/theme/tokens';

// Routes the user based on auth + whether a tennis profile exists yet.
export default function Index() {
  const { isLoading, isAuthenticated } = useConvexAuth();
  const me = useQuery(api.users.me, isAuthenticated ? {} : 'skip');

  if (isLoading) return <Splash />;
  if (!isAuthenticated) return <Redirect href="/(auth)/welcome" />;
  if (me === undefined) return <Splash />; // profile query still loading
  if (!me?.hasProfile) return <Redirect href="/(auth)/profile-setup" />;
  return <Redirect href="/(tabs)" />;
}

function Splash() {
  return <View style={{ flex: 1, backgroundColor: colors.courtGreen }} />;
}
