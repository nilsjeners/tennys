import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';
import Svg, { Path } from 'react-native-svg';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { ScoreText } from '@/components/ui/ScoreText';
import { SegmentedIcons } from '@/components/ui/SegmentedIcons';
import { TabBar } from '@/components/ui/TabBar';
import { PersonIcon, TeamIcon } from '@/components/ui/icons';
import { StrengthChart } from '@/components/ui/StrengthChart';
import { useToast } from '@/components/ui/Toast';
import { WinLossBar } from '@/components/ui/WinLossBar';
import { avatarColors, firstName, formatPctDelta, formatPoints, matchDateLabel } from '@/lib/format';
import { useI18n, type LocaleCode } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

type ApiPlayer = { profileId: string; name: string; initials: string; avatarUrl: string | null; isMe: boolean; delta: number; before: number; pctDelta: number; current: number };
type ApiSide = { players: ApiPlayer[]; name: string; scores: number[]; won: boolean };

export default function MatchDetail() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const matchId = id as Id<'matches'>;

  const detail = useQuery(api.matches.detail, { matchId });
  const comments = useQuery(api.comments.list, { matchId });
  const toggleReaction = useMutation(api.reactions.toggle);
  const addComment = useMutation(api.comments.add);
  const removeMatch = useMutation(api.matches.remove);

  const toast = useToast();
  const { t, locale } = useI18n();
  const [view, setView] = useState<'player' | 'team'>('player');
  const [statsOpen, setStatsOpen] = useState(false);
  const [draft, setDraft] = useState('');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);

  if (!detail) {
    return (
      <View style={{ flex: 1, backgroundColor: colors.screen }}>
        <Header title={t('match.title')} onBack={() => router.back()} />
        <View style={{ flex: 1 }} />
        <TabBar standalone />
      </View>
    );
  }

  const isDoubles = detail.type === 'doubles';
  const teamMode = isDoubles && view === 'team';
  const liked = detail.reactions.mine === 'like';

  // chart colors: upper/home side (sideA) in Sky, lower/away side (sideB) in
  // Coral; first player of a doubles pair gets the dark shade, second the light one.
  const statColor = (profileId: string) => {
    const inA = detail.sideA.players.findIndex((p) => p.profileId === profileId);
    if (inA !== -1) return inA === 0 ? colors.skyDark : colors.skyLight;
    const inB = detail.sideB.players.findIndex((p) => p.profileId === profileId);
    return inB === 0 ? colors.coralDark : colors.coralLight;
  };
  const statColors = detail.stats.map((p) => statColor(p.profileId));

  // Doppel/team view aggregates each side's two players into one team
  // line/balance — partners don't log matches on the same dates, so the merge
  // walks both series chronologically, forward-filling each player's latest
  // known value and summing.
  const teamSeries = (ids: string[]) => {
    const players = detail.stats.filter((p) => ids.includes(p.profileId));
    const events = players.flatMap((p, i) => p.series.map((pt) => ({ ...pt, i })));
    events.sort((a, b) => a.dateTime - b.dateTime);
    const running = players.map((p) => p.series[0]?.value ?? 0);
    return events.map((e) => {
      running[e.i] = e.value;
      return { value: running.reduce((a, b) => a + b, 0), dateTime: e.dateTime, matchId: e.matchId };
    });
  };
  const teamTotal = (ids: string[], field: 'wins' | 'losses') =>
    detail.stats.filter((p) => ids.includes(p.profileId)).reduce((sum, p) => sum + p[field], 0);

  const statRows = teamMode
    ? [
        { key: 'sideA', name: detail.sideA.name, color: colors.skyDark, points: teamSeries(detail.sideA.players.map((p) => p.profileId)), wins: teamTotal(detail.sideA.players.map((p) => p.profileId), 'wins'), losses: teamTotal(detail.sideA.players.map((p) => p.profileId), 'losses') },
        { key: 'sideB', name: detail.sideB.name, color: colors.coralDark, points: teamSeries(detail.sideB.players.map((p) => p.profileId)), wins: teamTotal(detail.sideB.players.map((p) => p.profileId), 'wins'), losses: teamTotal(detail.sideB.players.map((p) => p.profileId), 'losses') },
      ]
    : detail.stats.map((p, i) => ({ key: p.profileId, name: p.name, color: statColors[i], points: p.series, wins: p.wins, losses: p.losses }));

  const submit = async () => {
    const text = draft.trim();
    if (!text) return;
    setDraft('');
    try {
      await addComment({ matchId, text });
    } catch {
      setDraft(text);
      toast.show(t('match.commentFailed'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={t('match.title')}
        onBack={() => router.back()}
        trailing={
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
            <NotificationBell />
            {isDoubles ? (
              <SegmentedIcons
                activeIndex={view === 'player' ? 0 : 1}
                onChange={(i) => setView(i === 0 ? 'player' : 'team')}
                renderLeft={(s) => <PersonIcon size={20} color={s.stroke} fill={s.fill} />}
                renderRight={(s) => <TeamIcon size={20} color={s.stroke} fill={s.fill} />}
              />
            ) : null}
          </View>
        }
      />

      <Animated.View entering={SlideInRight} style={{ flex: 1 }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined} keyboardVerticalOffset={0}>
        <ScrollView contentContainerStyle={{ paddingTop: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
          {/* Score card */}
          <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingTop: 5, marginBottom: 16, ...cardShadow }}>
            <SideBlock side={detail.sideA as ApiSide} oppScores={detail.sideB.scores} teamMode={teamMode} locale={locale} onOpen={(pid) => router.push(`/player/${pid}`)} onOpenTeam={(pk) => router.push(`/team/${pk}`)} />
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border }}>
              <SideBlock side={detail.sideB as ApiSide} oppScores={detail.sideA.scores} teamMode={teamMode} locale={locale} onOpen={(pid) => router.push(`/player/${pid}`)} onOpenTeam={(pk) => router.push(`/team/${pk}`)} />
            </View>
            {/* footer */}
            <View style={{ borderTopWidth: 1, borderTopColor: colors.border, marginHorizontal: -20, paddingHorizontal: 20, paddingVertical: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 16 }}>
                <Pressable onPress={() => toggleReaction({ matchId, type: 'like' })} style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <RacketGlyph filled={liked} />
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: liked ? colors.limeText : colors.inkSecondary }}>{detail.reactions.total}</Text>
                </Pressable>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
                  <CommentGlyph />
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 13, color: colors.inkSecondary }}>{comments?.length ?? detail.comments}</Text>
                </View>
              </View>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{matchDateLabel(detail.dateTime, t, locale)}</Text>
            </View>
          </View>

          {/* Statistik toggle */}
          <Pressable
            onPress={() => setStatsOpen((v) => !v)}
            style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 15, marginBottom: 16, flexDirection: 'row', alignItems: 'center', gap: 11, ...cardShadow }}>
            <Feather name="bar-chart-2" size={18} color={colors.courtGreen} />
            <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{t('match.stats')}</Text>
            <Feather name={statsOpen ? 'chevron-up' : 'chevron-down'} size={18} color={colors.inkMuted} />
          </Pressable>

          {statsOpen ? (
            <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 16, marginBottom: 16, ...cardShadow }}>
              <Text style={labelStyle}>{t('match.strengthLast10')}</Text>
              <StrengthChart
                series={statRows.map((r) => ({ color: r.color, points: r.points }))}
                height={110}
                showDot
                highlightMatchId={detail.matchId}
              />
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 12 }}>
                {statRows.map((r) => (
                  <View key={r.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                    <View style={{ width: 12, height: 3, borderRadius: 2, backgroundColor: r.color }} />
                    <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkSecondary }}>{r.name}</Text>
                  </View>
                ))}
              </View>
              <View style={{ height: 1, backgroundColor: colors.border, marginVertical: 16, marginHorizontal: -20 }} />
              <Text style={labelStyle}>{t('match.balanceNormalized')}</Text>
              <View style={{ gap: 14 }}>
                {statRows.map((r) => (
                  <View key={r.key}>
                    <View style={{ flexDirection: 'row', alignItems: 'baseline', justifyContent: 'space-between', marginBottom: 5 }}>
                      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{r.name}</Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>{t('common.matches', { n: r.wins + r.losses })}</Text>
                    </View>
                    <WinLossBar wins={r.wins} losses={r.losses} />
                  </View>
                ))}
              </View>
            </View>
          ) : null}

          {/* Comments */}
          <Text style={[labelStyle, { paddingHorizontal: 20 }]}>{t('match.comments')}</Text>
          <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, ...cardShadow }}>
            {comments?.length ? (
              comments.map((c, i) => {
                const cc = avatarColors(c.profileId ?? c.id);
                return (
                  <View key={c.id} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, paddingVertical: 12, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                    <Avatar initials={c.initials} uri={c.avatarUrl} size={28} bg={cc.bg} fg={cc.fg} />
                    <View style={{ flex: 1 }}>
                      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{c.name}</Text>
                      <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: '#3F3D38', marginTop: 2, lineHeight: 18 }}>{c.text}</Text>
                    </View>
                  </View>
                );
              })
            ) : (
              <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, paddingVertical: 14 }}>{t('match.noComments')}</Text>
            )}

            {/* composer — always last: below the list, or below the empty-state copy */}
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12, borderTopWidth: 1, borderTopColor: colors.border }}>
              <MyAvatar />
              <TextInput
                value={draft}
                onChangeText={setDraft}
                placeholder={t('match.commentPlaceholder')}
                placeholderTextColor={colors.inkMuted}
                style={{ flex: 1, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.screen, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 11, fontSize: 14, color: colors.ink, fontFamily: fonts.sans }}
                onSubmitEditing={submit}
                returnKeyType="send"
              />
              <Pressable onPress={submit} style={{ width: 38, height: 38, borderRadius: 19, backgroundColor: colors.courtGreen, alignItems: 'center', justifyContent: 'center' }}>
                <Feather name="send" size={16} color={colors.lime} />
              </Pressable>
            </View>
          </View>

          {detail.canDelete ? (
            <Pressable
              onPress={() => setConfirmDelete(true)}
              style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 16 }}>
              <Feather name="trash-2" size={16} color={colors.redDark} />
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.redDark }}>{t('match.delete')}</Text>
            </Pressable>
          ) : null}
        </ScrollView>
      </KeyboardAvoidingView>
      </Animated.View>

      {/* double-opt-in confirmation, same convention as account deletion */}
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: radii.lg, padding: 22 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginBottom: 8 }}>{t('match.deleteTitle')}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, lineHeight: 21, marginBottom: 18 }}>
              {t('match.deleteBody')}
            </Text>
            <PrimaryButton
              label={t('match.deleteConfirm')}
              loading={deleting}
              style={{ backgroundColor: colors.redDark }}
              onPress={async () => {
                setDeleting(true);
                try {
                  await removeMatch({ matchId });
                  router.back();
                } catch {
                  toast.show(t('match.deleteFailed'));
                } finally {
                  setDeleting(false);
                  setConfirmDelete(false);
                }
              }}
            />
            <Pressable onPress={() => setConfirmDelete(false)} disabled={deleting} style={{ alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.inkSecondary }}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      <TabBar standalone />
    </View>
  );
}

function MyAvatar() {
  const me = useQuery(api.users.me, {});
  return <Avatar initials={me?.profile?.displayName?.slice(0, 2).toUpperCase() ?? 'DU'} uri={me?.avatarUrl} size={32} />;
}

function SideBlock({ side, oppScores, teamMode, locale, onOpen, onOpenTeam }: { side: ApiSide; oppScores: number[]; teamMode: boolean; locale: LocaleCode; onOpen: (pid: string) => void; onOpenTeam: (pairKey: string) => void }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 10 }}>
      <View style={{ flex: 1, gap: 12 }}>
        {teamMode ? (
          <TeamRow side={side} locale={locale} onOpenTeam={onOpenTeam} />
        ) : (
          side.players.map((p) => <PlayerRow key={p.profileId} p={p} locale={locale} onOpen={onOpen} />)
        )}
      </View>
      {/* per-set coloring: each won set dark, each lost set muted (PRD) */}
      <View style={{ flexDirection: 'row', gap: 8, marginLeft: 8 }}>
        {side.scores.map((s, i) => (
          <ScoreText key={i} size={44} color={s > (oppScores[i] ?? 0) ? colors.ink : colors.inkMuted}>{s}</ScoreText>
        ))}
      </View>
    </View>
  );
}

function PlayerRow({ p, locale, onOpen }: { p: ApiPlayer; locale: LocaleCode; onOpen: (pid: string) => void }) {
  const c = avatarColors(p.profileId);
  return (
    <Pressable onPress={() => onOpen(p.profileId)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <Avatar initials={p.initials} uri={p.avatarUrl} size={44} bg={c.bg} fg={c.fg} />
      <View style={{ flex: 1 }}>
        <Text numberOfLines={1} style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{p.name}</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <ScoreText size={22}>{formatPoints(p.current)}</ScoreText>
          <PctChip pct={p.pctDelta} locale={locale} />
        </View>
      </View>
    </Pressable>
  );
}

function TeamRow({ side, locale, onOpenTeam }: { side: ApiSide; locale: LocaleCode; onOpenTeam: (pairKey: string) => void }) {
  const totalCurrent = side.players.reduce((n, p) => n + p.current, 0);
  const totalDelta = side.players.reduce((n, p) => n + p.delta, 0);
  const totalBefore = side.players.reduce((n, p) => n + p.before, 0);
  const teamPct = totalBefore > 0 ? Math.round((totalDelta / totalBefore) * 1000) / 10 : 0;
  const a = { ...avatarColors(side.players[0].profileId), initials: side.players[0].initials, uri: side.players[0].avatarUrl };
  const b = { ...avatarColors(side.players[1].profileId), initials: side.players[1].initials, uri: side.players[1].avatarUrl };
  const pairKey = [side.players[0].profileId, side.players[1].profileId].sort().join('_');
  return (
    <Pressable onPress={() => onOpenTeam(pairKey)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
      <AvatarStack a={a} b={b} size={44} />
      <View style={{ flex: 1 }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
          <Text numberOfLines={1} style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>
            {side.players.map((p) => firstName(p.name)).join(' & ')}
          </Text>
          <Feather name="chevron-right" size={14} color={colors.chevron} />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
          <ScoreText size={22}>{formatPoints(totalCurrent)}</ScoreText>
          <PctChip pct={teamPct} locale={locale} />
        </View>
      </View>
    </Pressable>
  );
}

// Rating change as a relative percentage pill, e.g. "+1,9%" / "+1.9%" (PRD).
function PctChip({ pct, locale }: { pct: number; locale: LocaleCode }) {
  const bg = pct > 0 ? colors.limeWash : pct < 0 ? colors.errorWash : '#F1EFEA';
  const fg = pct > 0 ? colors.limeText : pct < 0 ? colors.redDark : colors.inkSecondary;
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 10, paddingVertical: 3, borderRadius: 999 }}>
      <ScoreText size={13} color={fg}>{formatPctDelta(pct, locale)}</ScoreText>
    </View>
  );
}

function RacketGlyph({ filled }: { filled: boolean }) {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill={filled ? colors.limeDark : 'none'} stroke={filled ? colors.limeText : colors.inkSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M7 10v12" />
      <Path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </Svg>
  );
}
function CommentGlyph() {
  return (
    <Svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke={colors.inkSecondary} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;

const labelStyle = {
  fontFamily: fonts.sansSemiBold,
  fontSize: 11,
  letterSpacing: 0.8,
  textTransform: 'uppercase' as const,
  color: colors.inkMuted,
  marginBottom: 8,
};
