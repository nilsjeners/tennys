import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { Pressable, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { colors, fonts } from '@/theme/tokens';

// Header bell + unread badge, shared by every screen that shows a dark
// Header (Spiele, Rangliste, Freunde, Profil, Spieldetail).
export function NotificationBell() {
  const router = useRouter();
  const unread = useQuery(api.notifications.unreadCount, {}) ?? 0;
  return (
    <Pressable onPress={() => router.push('/notifications')} hitSlop={8}>
      <Feather name="bell" size={22} color="rgba(255,255,255,0.8)" />
      {unread > 0 ? (
        <View style={{ position: 'absolute', top: -4, right: -6, minWidth: 16, height: 16, borderRadius: 8, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 3 }}>
          <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: colors.courtGreen }}>{unread > 9 ? '9+' : unread}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}
