import type { ReactNode } from 'react';
import { Text, View } from 'react-native';
import { ActivityGrid, type ActivityWeek } from '@/components/ui/ActivityGrid';
import { MatchCard } from '@/components/ui/MatchCard';
import { ScoreText } from '@/components/ui/ScoreText';
import { SetScoreBars } from '@/components/ui/SetScoreBars';
import { StrengthChart, type ChartPoint } from '@/components/ui/StrengthChart';
import { BalanceCard } from '@/components/ui/WinLossBar';
import { LOST_SET_ORDER, WON_SET_ORDER, formatPoints, matchDateLabel, setScoreBars, toCardSide } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { colors, fonts } from '@/theme/tokens';

export const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;

type Side = Parameters<typeof toCardSide>[0];
type RecentMatch = { matchId: string; dateTime: number; sideA: Side; sideB: Side; likes: number; comments: number };
type Activity = { weeks: ActivityWeek[]; wonSets: Record<string, number>; lostSets: Record<string, number>; todayTs: number } | null | undefined;

// The stats block shared by the own profile and other players' profiles —
// balance, strength history, set-score breakdown, activity, recent matches.
// Screen-specific extras (Rank card, Top Partners) slot in via `beforeSets`/`afterActivity`.
export function ProfileStats({
  wins,
  losses,
  points,
  series,
  activity,
  recentMatches,
  onOpenMatch,
  beforeSets,
  afterActivity,
}: {
  wins: number;
  losses: number;
  points: number;
  series: ChartPoint[];
  activity: Activity;
  recentMatches: RecentMatch[] | undefined;
  onOpenMatch: (matchId: string) => void;
  beforeSets?: ReactNode;
  afterActivity?: ReactNode;
}) {
  const { t, locale } = useI18n();

  return (
    <>
      <BalanceCard wins={wins} losses={losses} />

      <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 14, ...cardShadow }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{t('profile.strengthTitle')}</Text>
          <ScoreText size={18} color={colors.courtGreen}>
            {formatPoints(points)}
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, color: colors.inkMuted }}>{`  ${t('profile.last20')}`}</Text>
          </ScoreText>
        </View>
        <StrengthChart series={[{ color: colors.skyDark, points: series, area: true }]} height={110} interactive />
      </View>

      {beforeSets}

      <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 14, ...cardShadow, gap: 20 }}>
        <View>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 12 }}>{t('profile.setsWonTitle')}</Text>
          <SetScoreBars data={setScoreBars(activity?.wonSets, WON_SET_ORDER)} color={colors.skyLight} />
        </View>
        <View>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 12 }}>{t('profile.setsLostTitle')}</Text>
          <SetScoreBars data={setScoreBars(activity?.lostSets, LOST_SET_ORDER)} color={colors.coralLight} />
        </View>
      </View>

      <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 14, ...cardShadow }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 12 }}>{t('profile.activityTitle')}</Text>
        <ActivityGrid weeks={activity?.weeks ?? []} locale={locale} todayTs={activity?.todayTs ?? Date.now()} />
      </View>

      {afterActivity}

      <View>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 8, paddingHorizontal: 20 }}>
          {t('profile.recentMatches')}
        </Text>
        <View style={{ gap: 10 }}>
          {recentMatches?.length ? (
            recentMatches.map((m) => (
              <MatchCard
                key={m.matchId}
                data={{ sideA: toCardSide(m.sideA), sideB: toCardSide(m.sideB), likes: m.likes, comments: m.comments, dateLabel: matchDateLabel(m.dateTime, t, locale) }}
                onPress={() => onOpenMatch(m.matchId)}
              />
            ))
          ) : (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, paddingHorizontal: 20 }}>{t('profile.noMatches')}</Text>
          )}
        </View>
      </View>
    </>
  );
}
