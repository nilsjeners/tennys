import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { DisciplineToggle, type Discipline } from '@/components/ui/DisciplineToggle';
import { AvatarMenuButton, ProfileHero, KpiRow } from '@/components/ui/ProfileHero';
import { ScoreText } from '@/components/ui/ScoreText';
import { cardShadow, ProfileStats } from '@/components/profile/ProfileStats';
import { avatarColors } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { colors, fonts } from '@/theme/tokens';

function initials(name: string): string {
  const p = name.trim().split(/\s+/);
  return (p.length === 1 ? p[0].slice(0, 2) : p[0][0] + p[p.length - 1][0]).toUpperCase();
}

export default function Profil() {
  const router = useRouter();
  const { t } = useI18n();
  const [discipline, setDiscipline] = useState<Discipline>('singles');
  const [refreshing, setRefreshing] = useState(false);
  const me = useQuery(api.users.me, {});
  const summary = useQuery(api.stats.profileSummary, { discipline });
  const activity = useQuery(api.stats.activityAndSets, { discipline });
  const history = useQuery(api.matches.history, { limit: 8, discipline });
  const topPartners = useQuery(api.teams.topPartners, discipline === 'doubles' ? {} : 'skip');
  const profile = me?.profile;

  const stats = [
    { value: String(summary?.matches ?? 0), label: t('kpi.matches') },
    { value: String(summary?.wins ?? 0), label: t('kpi.wins') },
    { value: `${summary?.pct ?? 0}%`, label: t('kpi.rate') },
    { value: String(summary?.streak ?? 0), label: t('kpi.streak') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={profile?.displayName ?? ''}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell />
            <DisciplineToggle value={discipline} onChange={setDiscipline} variant="onDark" />
          </View>
        }
      />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} />}>
        <ProfileHero
          name={profile?.displayName ?? ' '}
          points={summary?.points ?? 1000}
          avatarUrl={me?.avatarUrl}
          initials={profile ? initials(profile.displayName) : '–'}
          avatarMenu={<AvatarMenuButton name="settings" onPress={() => router.push('/(tabs)/profil/einstellungen')} />}
        />
        <KpiRow stats={stats} />

        <View style={{ paddingVertical: 16, gap: 14 }}>
          <ProfileStats
            wins={summary?.wins ?? 0}
            losses={summary?.losses ?? 0}
            points={summary?.points ?? 1000}
            series={summary?.series ?? [{ value: 1000 }]}
            activity={activity}
            recentMatches={history}
            onOpenMatch={(id) => router.push(`/match/${id}`)}
            afterActivity={
              discipline === 'doubles' && topPartners?.length ? (
                <View style={{ backgroundColor: colors.white, ...cardShadow }}>
                  <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, paddingHorizontal: 20, paddingTop: 14, paddingBottom: 4 }}>
                    {t('profile.topPartners')}
                  </Text>
                  {topPartners.map((p, i) => {
                    const c = avatarColors(p.profileId);
                    return (
                      <Pressable
                        key={p.profileId}
                        onPress={() => router.push(`/player/${p.profileId}`)}
                        style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                        <View style={{ width: 28, height: 28, borderRadius: 14, borderWidth: 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
                          <ScoreText size={14}>{i + 1}</ScoreText>
                        </View>
                        <Avatar initials={p.initials} uri={p.avatarUrl} size={38} bg={c.bg} fg={c.fg} />
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Text numberOfLines={1} style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{p.name}</Text>
                          <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{t('common.matches', { n: p.games })}</Text>
                        </View>
                        <ScoreText size={22}>{p.pct} %</ScoreText>
                      </Pressable>
                    );
                  })}
                </View>
              ) : null
            }
          />
        </View>
      </ScrollView>
    </View>
  );
}
