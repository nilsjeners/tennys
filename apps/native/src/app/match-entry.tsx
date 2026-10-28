import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ActivityIndicator, Pressable, ScrollView, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { ScoreText } from '@/components/ui/ScoreText';
import { SegmentedIcons } from '@/components/ui/SegmentedIcons';
import { PersonIcon, TeamIcon } from '@/components/ui/icons';
import { useMatchDraft, type DraftPlayer } from '@/lib/matchDraft';
import { avatarColors, firstName, formatPoints } from '@/lib/format';
import { useT, type TFunction } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

export default function MatchEntry() {
  const insets = useSafeAreaInsets();
  const router = useRouter();
  const t = useT();
  const { mode, slots, matchId, setMatchId, reset } = useMatchDraft();
  const me = useQuery(api.users.me, {});
  const finishLive = useMutation(api.matches.finishLive);
  const cancelLive = useMutation(api.matches.cancelLive);
  const updateLiveScore = useMutation(api.matches.updateLiveScore);

  const [sets, setSets] = useState<[number, number][]>([[0, 0]]);
  const [view, setView] = useState<'player' | 'team'>('team');
  const [saving, setSaving] = useState(false);

  // Push every score change so the running result is visible live to the
  // other participants (via the Home live widget), not just once saved.
  useEffect(() => {
    if (!matchId) return;
    updateLiveScore({ matchId: matchId as Id<'matches'>, sets: sets.map(([a, b]) => ({ team1Games: a, team2Games: b })) });
  }, [matchId, sets, updateLiveScore]);

  const isDoubles = mode === 'Doppel';
  const meP: DraftPlayer | null = me?.profile
    ? {
        profileId: me.profile._id,
        name: me.profile.displayName,
        initials: me.profile.displayName.slice(0, 2).toUpperCase(),
        avatarUrl: me.avatarUrl,
        points: (isDoubles ? me.profile.ratingDoubles : me.profile.ratingSingles) ?? 1000,
      }
    : null;
  const resolve = (s: (typeof slots)[number]) => (s === 'me' ? meP : s);
  // team1 is always shown top, team2 bottom — matches how match-setup laid
  // them out, and how every other screen (Home, match detail, feed) shows
  // the same match: team1/team2 order is fixed, identical for every viewer.
  const team1 = isDoubles ? [resolve(slots[0]), resolve(slots[1])] : [resolve(slots[0])];
  const team2 = isDoubles ? [resolve(slots[2]), resolve(slots[3])] : [resolve(slots[1])];

  // All gestures operate on the active (last) set. Functional updates keep the
  // handlers stable so the gesture objects don't rebuild every render.
  const inc = useCallback((side: 0 | 1) => setSets((prev) => mutateActive(prev, side, (v) => v + 1)), []);
  const dec = useCallback((side: 0 | 1) => setSets((prev) => mutateActive(prev, side, (v) => Math.max(0, v - 1))), []);
  const six = useCallback((side: 0 | 1) => setSets((prev) => mutateActive(prev, side, () => 6)), []);
  const addSet = () => setSets((prev) => [...prev, [0, 0]]);
  const removeSet = (i: number) => setSets((prev) => (prev.length <= 1 ? prev : prev.filter((_, k) => k !== i)));

  const active = sets.length - 1;

  const save = async () => {
    if (saving || !matchId) return;
    setSaving(true);
    try {
      await finishLive({
        matchId: matchId as Id<'matches'>,
        sets: sets.map(([a, b]) => ({ team1Games: a, team2Games: b })),
      });
      const finishedId = matchId;
      reset();
      router.replace(`/match/${finishedId}`);
    } catch {
      setSaving(false);
    }
  };

  // ponytail: only the header back button cancels the live match — an iOS
  // swipe-back or the hardware back gesture skips this and leaves the row
  // live until the next `startLive` call clears stale ones. Upgrade: a
  // navigation `beforeRemove` listener if orphaned lives turn out to matter.
  const onBack = () => {
    if (matchId) cancelLive({ matchId: matchId as Id<'matches'> });
    setMatchId(null);
    router.back();
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={t('matchEntry.title')}
        onBack={onBack}
        trailing={
          isDoubles ? (
            <SegmentedIcons
              activeIndex={view === 'player' ? 0 : 1}
              onChange={(i) => setView(i === 0 ? 'player' : 'team')}
              renderLeft={(s) => <PersonIcon size={20} color={s.stroke} fill={s.fill} />}
              renderRight={(s) => <TeamIcon size={20} color={s.stroke} fill={s.fill} />}
            />
          ) : null
        }
      />

      <View style={{ flex: 1 }}>
        {/* team1 — always top */}
        <SideZone onInc={() => inc(0)} onDec={() => dec(0)} onSix={() => six(0)}>
          <TeamDisplay players={team1} doubles={isDoubles} teamView={view === 'team'} games={sets[active][0]} t={t} />
        </SideZone>

        <View style={{ height: 3, backgroundColor: colors.borderStrong }} />

        {/* team2 — always bottom */}
        <SideZone onInc={() => inc(1)} onDec={() => dec(1)} onSix={() => six(1)} flipped>
          <TeamDisplay players={team2} doubles={isDoubles} teamView={view === 'team'} games={sets[active][1]} t={t} reversed />
        </SideZone>

        {/* center axis: completed sets as small boxes ON the divider, "+ Satz"
            fixed on the right; scrolls horizontally when sets pile up (PRD) */}
        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: '50%', left: 0, right: 0, marginTop: -19, height: 38, flexDirection: 'row', alignItems: 'center' }}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={{ alignItems: 'center', gap: 8, paddingHorizontal: 14 }}
            style={{ flexGrow: 0, flexShrink: 1 }}>
            {sets.slice(0, active).map((s, i) => (
              <View
                key={i}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 6,
                  backgroundColor: '#EDEBE5',
                  borderWidth: 2,
                  borderColor: '#fff',
                  borderRadius: radii.sm,
                  paddingHorizontal: 10,
                  paddingVertical: 6,
                  shadowColor: '#000',
                  shadowOpacity: 0.12,
                  shadowRadius: 6,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 3,
                }}>
                <ScoreText size={17} color={colors.inkSecondary}>{s[0]}:{s[1]}</ScoreText>
                <Pressable onPress={() => removeSet(i)} hitSlop={8}>
                  <Feather name="x" size={13} color={colors.inkMuted} />
                </Pressable>
              </View>
            ))}
          </ScrollView>
          <View style={{ flex: 1 }} pointerEvents="none" />
          <Pressable
            onPress={addSet}
            style={{
              flexDirection: 'row',
              alignItems: 'center',
              gap: 5,
              marginRight: 14,
              paddingVertical: 8,
              paddingHorizontal: 13,
              borderRadius: radii.pill,
              backgroundColor: colors.courtGreen,
              borderWidth: 2,
              borderColor: '#fff',
              shadowColor: '#000',
              shadowOpacity: 0.2,
              shadowRadius: 8,
              shadowOffset: { width: 0, height: 3 },
              elevation: 4,
            }}>
            <Feather name="plus" size={14} color={colors.lime} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: colors.lime }}>{t('matchEntry.addSet')}</Text>
          </Pressable>
        </View>
      </View>

      {/* footer: save only — set management lives on the center axis */}
      <View style={{ backgroundColor: colors.white, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12 }}>
        <Pressable
          onPress={save}
          disabled={saving}
          style={{ backgroundColor: colors.lime, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center', marginBottom: insets.bottom > 0 ? insets.bottom : 20, opacity: saving ? 0.6 : 1 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            {saving ? <ActivityIndicator size="small" color={colors.ink} /> : null}
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink }}>{t('matchEntry.save')}</Text>
          </View>
        </Pressable>
      </View>
    </View>
  );
}

function mutateActive(prev: [number, number][], side: 0 | 1, fn: (v: number) => number): [number, number][] {
  const next = prev.map((s) => [...s] as [number, number]);
  const i = next.length - 1;
  next[i][side] = fn(next[i][side]);
  return next;
}

// A tappable/swipeable half. Tap or swipe-up = +1, long-press = 6, swipe-down = −1.
function SideZone({
  children,
  onInc,
  onDec,
  onSix,
  flipped,
}: {
  children: React.ReactNode;
  onInc: () => void;
  onDec: () => void;
  onSix: () => void;
  flipped?: boolean;
}) {
  const gesture = useMemo(() => {
    const tap = Gesture.Tap()
      .maxDuration(300)
      .onEnd((_e, success) => {
        if (success) runOnJS(onInc)();
      });
    const longPress = Gesture.LongPress()
      .minDuration(400)
      .onStart(() => runOnJS(onSix)());
    const pan = Gesture.Pan()
      .activeOffsetY([-20, 20])
      .onEnd((e) => {
        if (e.translationY <= -20) runOnJS(onInc)();
        else if (e.translationY >= 20) runOnJS(onDec)();
      });
    return Gesture.Race(longPress, pan, tap);
  }, [onInc, onDec, onSix]);

  return (
    <GestureDetector gesture={gesture}>
      <View
        style={{
          flex: 1,
          alignItems: 'center',
          justifyContent: flipped ? 'flex-start' : 'flex-end',
          // ponytail: eyeballed. The near-divider side (paddingBottom here,
          // paddingTop when flipped) sets the gap to the center line — kept
          // equal on both sides so they stay balanced. The far side mirrors
          // the same two numbers swapped, so both zones sum to the same
          // total height and the divider stays exactly centered — otherwise
          // the absolutely-positioned set-chips row (anchored to the
          // container's 50%) drifts off the real divider.
          paddingTop: flipped ? 58 : 38,
          paddingBottom: flipped ? 24 : 44,
        }}>
        {children}
      </View>
    </GestureDetector>
  );
}

function TeamDisplay({
  players,
  doubles,
  teamView,
  games,
  t,
  reversed,
}: {
  players: (DraftPlayer | null)[];
  doubles: boolean;
  teamView: boolean;
  games: number;
  t: TFunction;
  reversed?: boolean;
}) {
  const valid = players.filter(Boolean) as DraftPlayer[];
  // Bebas Neue reserves extra whitespace below the glyph baseline that lineHeight
  // doesn't trim; this margin eats it so the gap on the score's trailing side
  // (line above, avatar below, depending on orientation) matches its leading side.
  // ponytail: eyeballed offset, retune if the font asset or size changes.
  const bigScore = <ScoreText size={84} lineHeight={86} style={{ marginBottom: -14 }}>{games}</ScoreText>;
  if (!valid.length) return <View>{bigScore}</View>;

  let identity: React.ReactNode;
  if (doubles && teamView) {
    const a = { ...avatarColors(valid[0].profileId), initials: valid[0].initials, uri: valid[0].avatarUrl };
    const b = valid[1] ? { ...avatarColors(valid[1].profileId), initials: valid[1].initials, uri: valid[1].avatarUrl } : a;
    const totalPoints = valid.reduce((sum, p) => sum + p.points, 0);
    identity = (
      <View style={{ alignItems: 'center', gap: 4 }}>
        <AvatarStack a={a} b={b} size={96} border="#fff" />
        <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>{valid.map((p) => firstName(p.name)).join(' & ')}</Text>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkMuted }}>{formatPoints(totalPoints)} {t('common.pointsShort')}</Text>
      </View>
    );
  } else if (doubles) {
    identity = (
      <View style={{ flexDirection: 'row', gap: 18 }}>
        {valid.map((p) => (
          <PlayerBubble key={p.profileId} p={p} t={t} />
        ))}
      </View>
    );
  } else {
    identity = <PlayerBubble p={valid[0]} t={t} />;
  }

  return (
    <View style={{ alignItems: 'center', gap: 10 }}>
      {reversed ? bigScore : identity}
      {reversed ? identity : bigScore}
    </View>
  );
}

function PlayerBubble({ p, t }: { p: DraftPlayer; t: TFunction }) {
  const c = avatarColors(p.profileId);
  return (
    <View style={{ alignItems: 'center', gap: 4 }}>
      <Avatar initials={p.initials} uri={p.avatarUrl} size={88} bg={c.bg} fg={c.fg} style={{ borderWidth: 3, borderColor: '#fff' }} />
      <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.ink }}>{p.name}</Text>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkMuted }}>{formatPoints(p.points)} {t('common.pointsShort')}</Text>
    </View>
  );
}
