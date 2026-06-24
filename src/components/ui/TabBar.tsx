import { Pressable, Text, View } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import type { BottomTabBarProps } from 'expo-router/js-tabs';
import { colors, fonts } from '@/theme/tokens';

const TABS: { name: string; label: string; icon: React.ComponentProps<typeof Feather>['name'] }[] = [
  { name: 'index', label: 'Matches', icon: 'home' },
  { name: 'rangliste', label: 'Rangliste', icon: 'award' },
  { name: 'spieler', label: 'Spieler', icon: 'search' },
  { name: 'profil', label: 'Profil', icon: 'user' },
];

// Custom bottom bar: 4 tabs + a raised lime FAB (Match erfassen) in the centre.
export function TabBar({ state, navigation }: BottomTabBarProps) {
  const insets = useSafeAreaInsets();
  const router = useRouter();

  const renderTab = (tab: (typeof TABS)[number]) => {
    const routeIndex = state.routes.findIndex((r) => r.name === tab.name);
    const focused = state.index === routeIndex;
    return (
      <Pressable
        key={tab.name}
        onPress={() => {
          const event = navigation.emit({ type: 'tabPress', target: state.routes[routeIndex].key, canPreventDefault: true });
          if (!focused && !event.defaultPrevented) navigation.navigate(tab.name);
        }}
        style={{ flex: 1, alignItems: 'center', gap: 4 }}>
        <Feather name={tab.icon} size={22} color={focused ? colors.ink : colors.inkMuted} />
        <Text
          style={{
            fontSize: 10,
            fontFamily: focused ? fonts.sansSemiBold : fonts.sans,
            color: focused ? colors.ink : colors.inkMuted,
          }}>
          {tab.label}
        </Text>
      </Pressable>
    );
  };

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
      {renderTab(TABS[0])}
      {renderTab(TABS[1])}

      {/* Centre FAB → Match erfassen */}
      <View style={{ flex: 1, alignItems: 'center' }}>
        <Pressable
          onPress={() => router.push('/match-create')}
          style={{
            width: 52,
            height: 52,
            borderRadius: 26,
            marginTop: -26,
            backgroundColor: colors.lime,
            alignItems: 'center',
            justifyContent: 'center',
            shadowColor: colors.lime,
            shadowOpacity: 0.55,
            shadowRadius: 12,
            shadowOffset: { width: 0, height: 4 },
            elevation: 6,
          }}>
          <Feather name="plus" size={26} color={colors.courtGreen} />
        </Pressable>
        <Text style={{ fontSize: 10, fontFamily: fonts.sans, color: colors.inkMuted, marginTop: 4 }}>Match</Text>
      </View>

      {renderTab(TABS[2])}
      {renderTab(TABS[3])}
    </View>
  );
}
