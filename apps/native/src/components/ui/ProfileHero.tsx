import { Image } from 'expo-image';
import { Feather } from '@expo/vector-icons';
import { Pressable, Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';
import { ScoreText } from '@/components/ui/ScoreText';
import { formatPoints } from '@/lib/format';

export type HeroStat = { value: string; label: string };

// Circular translucent button that overlays the profile photo (top-right) —
// gear on the own profile, "…" menu trigger on other players' profiles.
export function AvatarMenuButton({
  name,
  onPress,
}: {
  name: React.ComponentProps<typeof Feather>['name'];
  onPress?: () => void;
}) {
  return (
    <Pressable
      onPress={onPress}
      hitSlop={10}
      style={{
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: 'rgba(0,0,0,0.35)',
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Feather name={name} size={16} color="#fff" />
    </Pressable>
  );
}

// Profile header (PRD redesign): full-bleed image, NO massive color blocks —
// a fine hairline separates the image from the name + points row. The
// Einzel/Doppel toggle overlaps the image's bottom-right corner via `badge`.
export function ProfileHero({
  name,
  points,
  avatarUrl,
  initials,
  avatarBg = colors.courtGreen,
  avatarFg = colors.lime,
  avatarMenu,
}: {
  name: string;
  points: number;
  avatarUrl?: string | null;
  initials: string;
  avatarBg?: string;
  avatarFg?: string;
  avatarMenu?: React.ReactNode;
}) {
  return (
    <View style={{ backgroundColor: colors.white }}>
      <View style={{ width: '100%', aspectRatio: 1, backgroundColor: avatarBg, alignItems: 'center', justifyContent: 'center' }}>
        {avatarUrl ? (
          <Image source={{ uri: avatarUrl }} style={{ width: '100%', height: '100%' }} contentFit="cover" />
        ) : (
          <Text style={{ fontFamily: fonts.display, fontSize: 96, color: avatarFg, opacity: 0.9 }}>{initials}</Text>
        )}
        {avatarMenu ? <View style={{ position: 'absolute', top: 14, right: 14 }}>{avatarMenu}</View> : null}
      </View>

      {/* fine hairline + name/points row — no color blocks */}
      <View style={{ borderTopWidth: 1.5, borderTopColor: colors.border, paddingHorizontal: 20, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 12 }}>
        <Text numberOfLines={1} style={{ flexShrink: 1, fontFamily: fonts.display, fontSize: 26, lineHeight: 26, color: colors.ink }}>{name}</Text>
        <ScoreText size={26}>{formatPoints(points)}</ScoreText>
      </View>
    </View>
  );
}

// Light KPI row: Spiele | Siege | Quote | Serie (PRD — no dark blocks).
export function KpiRow({ stats }: { stats: HeroStat[] }) {
  return (
    <View style={{ flexDirection: 'row', backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, borderBottomWidth: 1, borderBottomColor: colors.border }}>
      {stats.map((s, i) => (
        <View
          key={s.label}
          style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRightWidth: i < stats.length - 1 ? 1 : 0, borderRightColor: colors.border }}>
          <ScoreText size={22}>{s.value}</ScoreText>
          <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.inkMuted, marginTop: 3 }}>{s.label}</Text>
        </View>
      ))}
    </View>
  );
}
