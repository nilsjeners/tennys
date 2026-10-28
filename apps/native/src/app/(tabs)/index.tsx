import { usePaginatedQuery, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import Animated, { useAnimatedStyle, useSharedValue, withRepeat, withTiming } from 'react-native-reanimated';

import { api } from '@repo/backend/convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { DisciplineFilterToggle, type DisciplineFilter } from '@/components/ui/DisciplineFilterToggle';
import { MatchCard } from '@/components/ui/MatchCard';
import { ScoreText } from '@/components/ui/ScoreText';
import { Header } from '@/components/ui/Header';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { avatarColors, matchDateLabel, toCardSide } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

const PAGE_SIZE = 10;

export default function Spiele() {
  const router = useRouter();
  const { t, locale } = useI18n();
  const [refreshing, setRefreshing] = useState(false);
  const [filter, setFilter] = useState<DisciplineFilter>('both');
  const home = useQuery(api.matches.home, {});
  const { results, status, loadMore } = usePaginatedQuery(
    api.matches.feed,
    { discipline: filter === 'both' ? undefined : filter },
    { initialNumItems: PAGE_SIZE }
  );
  const live = home?.live ?? null;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={t('home.title')}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell />
            <DisciplineFilterToggle value={filter} onChange={setFilter} />
          </View>
        }
        footer={
          live ? (
            <View style={{ borderTopWidth: 1, borderTopColor: 'rgba(255,255,255,0.15)', paddingHorizontal: 16, paddingTop: 14, paddingBottom: 18 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <PulsingDot />
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: colors.red, letterSpacing: 0.6 }}>{t('home.live')}</Text>
                </View>
                <ElapsedTimer startedAt={live.startedAt} />
              </View>
              <LiveRow p={live.sideA} others={live.sideB.scores} nameColor="#fff" />
              <View style={{ height: 8 }} />
              <LiveRow p={live.sideB} others={live.sideA.scores} nameColor="rgba(255,255,255,0.7)" />
            </View>
          ) : null
        }
      />

      <ScrollView
        contentContainerStyle={{ paddingVertical: 16, gap: 12 }}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} />}>
        {results.length ? (
          <>
            {results.map((m) => (
              <MatchCard
                key={m.matchId}
                data={{ sideA: toCardSide(m.sideA), sideB: toCardSide(m.sideB), likes: m.likes, comments: m.comments, dateLabel: matchDateLabel(m.dateTime, t, locale) }}
                onPress={() => router.push(`/match/${m.matchId}`)}
              />
            ))}
            {status === 'CanLoadMore' ? (
              <Pressable
                onPress={() => loadMore(PAGE_SIZE)}
                style={{ alignSelf: 'center', backgroundColor: colors.white, borderWidth: 1, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: 18, paddingVertical: 9, marginTop: 4 }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkSecondary }}>{t('home.loadMore')}</Text>
              </Pressable>
            ) : null}
          </>
        ) : (
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, textAlign: 'center', paddingHorizontal: 24, paddingTop: 32 }}>
            {status === 'LoadingFirstPage' ? ' ' : t('home.empty')}
          </Text>
        )}
      </ScrollView>
    </View>
  );
}

// Slow opacity breathe on the "LIVE" indicator dot.
function PulsingDot() {
  const opacity = useSharedValue(1);
  useEffect(() => {
    opacity.value = withRepeat(withTiming(0.25, { duration: 700 }), -1, true);
  }, [opacity]);
  const style = useAnimatedStyle(() => ({ opacity: opacity.value }));
  return <Animated.View style={[{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.red }, style]} />;
}

// Elapsed match time, ticking every second — replaces the old "Satz N" label.
function ElapsedTimer({ startedAt }: { startedAt: number }) {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(id);
  }, []);
  const elapsed = Math.max(0, Math.floor((now - startedAt) / 1000));
  const mm = String(Math.floor(elapsed / 60)).padStart(2, '0');
  const ss = String(elapsed % 60).padStart(2, '0');
  return <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', fontVariant: ['tabular-nums'] }}>{mm}:{ss}</Text>;
}

// A set counts as won the moment the score is a valid tennis set result —
// 6+ games with a 2-game lead, or 7-5 / 7-6 — regardless of whether it's a
// past set or the one still being played. Not yet decided → both white.
function isSetDecided(a: number, b: number): boolean {
  if (Math.max(a, b) < 6) return false;
  if (Math.abs(a - b) >= 2) return true;
  return a === 7 || b === 7;
}

function LiveRow({
  p,
  others,
  nameColor,
}: {
  p: { name: string; initials: string; avatarUrl: string | null; scores: number[] };
  others: number[];
  nameColor: string;
}) {
  const c = avatarColors(p.name);
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Avatar initials={p.initials} uri={p.avatarUrl} size={38} bg={c.bg} fg={c.fg} />
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: nameColor }}>{p.name}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {p.scores.map((s, i) => {
          const opp = others[i] ?? 0;
          const decided = isSetDecided(s, opp);
          const color = !decided ? '#fff' : s > opp ? colors.lime : s < opp ? colors.inkMuted : '#fff';
          return (
            <ScoreText key={i} size={23} color={color}>{s}</ScoreText>
          );
        })}
      </View>
    </View>
  );
}
