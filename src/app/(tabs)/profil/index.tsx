import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Card } from '@/components/ui/Card';
import { DarkHeader } from '@/components/ui/DarkHeader';
import { MatchHistoryRow } from '@/components/ui/MatchHistoryRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { avatarColors, matchDateLabel, scoreLine } from '@/lib/format';
import { colors, fonts, radii } from '@/theme/tokens';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function Profil() {
  const router = useRouter();
  const me = useQuery(api.users.me, {});
  const summary = useQuery(api.stats.profileSummary, {});
  const history = useQuery(api.matches.history, { limit: 8 });

  const profile = me?.profile;
  const stats = [
    { value: String(summary?.matches ?? 0), label: 'Matches' },
    { value: String(summary?.wins ?? 0), label: 'Siege' },
    { value: `${summary?.pct ?? 0}%`, label: 'Quote' },
    { value: String(summary?.streak ?? 0), label: 'Serie' },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader paddingBottom={22}>
        <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 14, marginBottom: 18 }}>
          <View style={{ borderWidth: 2, borderColor: colors.lime, borderRadius: 41 }}>
            <View style={{ borderWidth: 3, borderColor: colors.courtGreen, borderRadius: 39 }}>
              <View style={{ width: 68, height: 68, borderRadius: 34, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.courtGreen }}>{profile ? initials(profile.displayName) : '–'}</Text>
              </View>
            </View>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.display, fontSize: 26, color: '#fff' }}>{profile?.displayName ?? ' '}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 2 }}>
              {profile?.username ? `@${profile.username}` : ''}{profile?.city ? ` · ${profile.city}` : ''}
            </Text>
          </View>
          <Pressable onPress={() => router.push('/(tabs)/profil/edit')} style={{ backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.sm, paddingHorizontal: 14, paddingVertical: 8 }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#fff' }}>Bearbeiten</Text>
          </Pressable>
        </View>

        <View style={{ flexDirection: 'row', backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 14 }}>
          {stats.map((s, i) => (
            <View key={s.label} style={{ flex: 1, alignItems: 'center', paddingVertical: 13, borderRightWidth: i < stats.length - 1 ? 1 : 0, borderRightColor: 'rgba(255,255,255,0.08)' }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 22, color: colors.lime, lineHeight: 22 }}>{s.value}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>{s.label}</Text>
            </View>
          ))}
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 10, marginBottom: 18 }}>
          <ActionTile icon="bar-chart-2" label="Statistik" onPress={() => router.push('/(tabs)/profil/statistik')} />
          <ActionTile icon="settings" label="Einstellungen" onPress={() => router.push('/(tabs)/profil/einstellungen')} />
        </View>

        <SectionLabel style={{ marginLeft: 4 }}>Letzte Matches</SectionLabel>
        <Card flush>
          {history?.length ? (
            history.map((m, i) => {
              const c = m.opponentId ? avatarColors(m.opponentId) : { bg: colors.courtGreen, fg: colors.lime };
              return (
                <MatchHistoryRow
                  key={m.matchId}
                  entry={{ initials: m.opponentInitials, bg: c.bg, fg: c.fg, name: m.opponentName, sub: matchDateLabel(m.dateTime), score: scoreLine(m.sets), win: m.win }}
                  last={i === history.length - 1}
                />
              );
            })
          ) : (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, padding: 16 }}>Noch keine Matches.</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function ActionTile({ icon, label, onPress }: { icon: React.ComponentProps<typeof Feather>['name']; label: string; onPress?: () => void }) {
  return (
    <Pressable onPress={onPress} style={({ pressed }) => ({ flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.md, paddingVertical: 13, opacity: pressed ? 0.85 : 1 })}>
      <Feather name={icon} size={17} color={colors.courtGreen} />
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
