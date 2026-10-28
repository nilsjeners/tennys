import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import Svg, { Line } from 'react-native-svg';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { RacketIcon, TrophyIcon } from '@/components/ui/icons';
import { useT } from '@/lib/i18n';
import { colors, fonts } from '@/theme/tokens';

// path each tab resolves to when this bar is rendered outside the Tabs
// navigator (e.g. pushed on top of a stack screen like match detail).
const TAB_PATHS = {
  index: '/(tabs)',
  freunde: '/(tabs)/freunde',
  rangliste: '/(tabs)/rangliste',
  profil: '/(tabs)/profil',
} as const;

// PRD tab bar: Spiele | Freunde | ＋(FAB, center) | Rangliste | Profil.
// Standardized icon sizes; only the FAB is raised.
export function TabBar(props: BottomTabBarProps | { standalone: true }) {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const me = useQuery(api.users.me, {});

  const isFocused = (name: keyof typeof TAB_PATHS) => 'state' in props && props.state.routes[props.state.index]?.name === name;
  const go = (name: keyof typeof TAB_PATHS) => {
    if (!('state' in props)) {
      router.push(TAB_PATHS[name]);
      return;
    }
    const route = props.state.routes.find((r) => r.name === name);
    if (!route) return;
    const event = props.navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
    if (!isFocused(name) && !event.defaultPrevented) props.navigation.navigate(name);
  };

  const label = (active: boolean) => ({
    fontSize: 10,
    fontFamily: active ? fonts.sansSemiBold : fonts.sans,
    color: active ? colors.ink : colors.inkMuted,
  });
  const iconColor = (active: boolean) => (active ? colors.ink : colors.inkMuted);

  const profilActive = isFocused('profil');

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: colors.white,
        borderTopWidth: 1,
        borderTopColor: colors.border,
        paddingTop: 8,
        paddingBottom: insets.bottom > 0 ? insets.bottom : 16,
      }}>
      {/* Spiele */}
      <Pressable onPress={() => go('index')} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <RacketIcon size={22} color={iconColor(isFocused('index'))} />
        <Text style={label(isFocused('index'))}>{t('tabs.matches')}</Text>
      </Pressable>

      {/* Freunde */}
      <Pressable onPress={() => go('freunde')} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <Feather name="users" size={22} color={iconColor(isFocused('freunde'))} />
        <Text style={label(isFocused('freunde'))}>{t('tabs.friends')}</Text>
      </Pressable>

      {/* ＋ Spiel — raised lime FAB → match setup */}
      <Pressable onPress={() => router.push('/match-setup')} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <View
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            marginTop: -18,
            backgroundColor: colors.courtGreen,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.lime,
            shadowOpacity: 0.55,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}>
          <Svg width={26} height={26} viewBox="0 0 24 24">
            <Line x1={12} y1={5} x2={12} y2={19} stroke={colors.lime} strokeWidth={2.6} strokeLinecap="round" />
            <Line x1={5} y1={12} x2={19} y2={12} stroke={colors.lime} strokeWidth={2.6} strokeLinecap="round" />
          </Svg>
        </View>
        <Text style={{ fontSize: 10, fontFamily: fonts.sans, color: colors.inkMuted }}>{t('tabs.newMatch')}</Text>
      </Pressable>

      {/* Rangliste */}
      <Pressable onPress={() => go('rangliste')} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <TrophyIcon size={22} color={iconColor(isFocused('rangliste'))} />
        <Text style={label(isFocused('rangliste'))}>{t('tabs.ranking')}</Text>
      </Pressable>

      {/* Profil — small round avatar, standardized size */}
      <Pressable onPress={() => go('profil')} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <View style={{ borderRadius: 999, borderWidth: 1.5, borderColor: profilActive ? colors.ink : 'transparent', padding: 1 }}>
          <Avatar initials={me?.profile?.displayName?.slice(0, 2).toUpperCase() ?? 'DU'} uri={me?.avatarUrl} size={22} />
        </View>
        <Text style={label(profilActive)}>{t('tabs.profile')}</Text>
      </Pressable>
    </View>
  );
}
