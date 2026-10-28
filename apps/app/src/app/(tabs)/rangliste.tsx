import { useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { DisciplineToggle, type Discipline } from '@/components/ui/DisciplineToggle';
import { ScoreText } from '@/components/ui/ScoreText';
import { Header, SubHeaderBar } from '@/components/ui/Header';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { SearchInput } from '@/components/ui/SearchInput';
import { avatarColors, formatPoints } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

const PAGE_SIZE = 10;

export default function Rangliste() {
  const router = useRouter();
  const t = useT();
  const [discipline, setDiscipline] = useState<Discipline>('singles');
  const [query, setQuery] = useState('');
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [refreshing, setRefreshing] = useState(false);
  const ranking = useQuery(api.players.ranking, { discipline });

  const q = query.trim().toLowerCase();
  const filtered = (ranking ?? []).filter((r) => !q || r.name.toLowerCase().includes(q));
  const rows = filtered.slice(0, visible);
  const avg = ranking?.length ? Math.round(ranking.reduce((n, r) => n + r.points, 0) / ranking.length) : 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={t('ranking.title')}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell />
            <DisciplineToggle value={discipline} onChange={setDiscipline} />
          </View>
        }
      />

      <SubHeaderBar>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>
          {ranking ? t('ranking.summary', { n: ranking.length, avg: formatPoints(avg) }) : ' '}
        </Text>
        <SearchInput value={query} onChangeText={(v) => { setQuery(v); setVisible(PAGE_SIZE); }} placeholder={t('ranking.searchPlaceholder')} />
      </SubHeaderBar>

      <ScrollView
        contentContainerStyle={{ paddingBottom: 16 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} />}>
        <View style={{ backgroundColor: colors.white }}>
          {rows.map((r, i) => {
            const c = avatarColors(r.profileId);
            const podium = r.rank <= 3;
            return (
              <Pressable
                key={r.profileId}
                onPress={() => router.push(r.you ? '/(tabs)/profil' : `/player/${r.profileId}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 12,
                  paddingHorizontal: 20,
                  paddingVertical: 13,
                  borderBottomWidth: i === rows.length - 1 ? 0 : 1,
                  borderBottomColor: colors.border,
                  backgroundColor: r.you ? '#F2F1EB' : colors.white,
                }}>
                {/* ranks 1-3 circled, from 4 plain left-aligned digit */}
                <View
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: 14,
                    borderWidth: podium ? 1.5 : 0,
                    borderColor: colors.borderStrong,
                    alignItems: podium ? 'center' : 'flex-start',
                    justifyContent: 'center',
                  }}>
                  <ScoreText size={14} color={colors.ink}>{r.rank}</ScoreText>
                </View>
                <Avatar initials={r.initials} uri={r.avatarUrl} size={38} bg={c.bg} fg={c.fg} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: r.you ? fonts.sansBold : fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>
                    {r.name}
                    {r.you ? ` ${t('ranking.you')}` : ''}
                  </Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>
                    {t('ranking.rowSub', { matches: r.matches, pct: r.pct })}
                  </Text>
                </View>
                <ScoreText size={22} color={colors.ink}>{formatPoints(r.points)}</ScoreText>
              </Pressable>
            );
          })}
        </View>

        {filtered.length > visible ? (
          <Pressable
            onPress={() => setVisible((v) => v + PAGE_SIZE)}
            style={{ alignSelf: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 9, marginTop: 14 }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkSecondary }}>{t('ranking.loadMore')}</Text>
          </Pressable>
        ) : null}

        {ranking && filtered.length === 0 ? (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, textAlign: 'center', paddingTop: 24 }}>{t('ranking.noneFound')}</Text>
        ) : null}
      </ScrollView>
    </View>
  );
}
