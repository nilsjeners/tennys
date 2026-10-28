import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useRef, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withSequence, withSpring, withTiming } from 'react-native-reanimated';
import Svg, { Path, Rect } from 'react-native-svg';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Avatar } from '@/components/ui/Avatar';
import { DarkHeader, HeaderIconButton } from '@/components/ui/Header';
import { useToast } from '@/components/ui/Toast';
import { DisciplineToggle, type Discipline } from '@/components/ui/DisciplineToggle';
import { useMatchDraft, type DraftPlayer, type SlotValue } from '@/lib/matchDraft';
import { avatarColors, formatPoints } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

export default function MatchSetup() {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const { mode, slots, setMode, addPlayer, removePlayer, swapSlots, setMatchId } = useMatchDraft();
  const me = useQuery(api.users.me, {});
  const friends = useQuery(api.friends.list, {});
  const startLive = useMutation(api.matches.startLive);
  const [query, setQuery] = useState('');
  const [starting, setStarting] = useState(false);

  const isDoubles = mode === 'Doppel';
  const realPlayers = slots.filter((s): s is DraftPlayer => s !== null && s !== 'me');
  const needed = isDoubles ? 3 : 1;
  const complete = realPlayers.length === needed;

  const meP: DraftPlayer | null = me?.profile
    ? {
        profileId: me.profile._id,
        name: me.profile.displayName,
        initials: me.profile.displayName.slice(0, 2).toUpperCase(),
        avatarUrl: me.avatarUrl,
        points: (isDoubles ? me.profile.ratingDoubles : me.profile.ratingSingles) ?? 1000,
      }
    : null;
  const resolve = (s: SlotValue): DraftPlayer | null => (s === 'me' ? meP : s);

  const topIndices = isDoubles ? [0, 1] : [0];
  const botIndices = isDoubles ? [2, 3] : [1];

  const onContinue = async () => {
    if (starting) return;
    const team1 = topIndices.map((i) => resolve(slots[i])).filter(Boolean) as DraftPlayer[];
    const team2 = botIndices.map((i) => resolve(slots[i])).filter(Boolean) as DraftPlayer[];
    setStarting(true);
    try {
      const matchId = await startLive({
        team1ProfileIds: team1.map((p) => p.profileId as Id<'playerProfiles'>),
        team2ProfileIds: team2.map((p) => p.profileId as Id<'playerProfiles'>),
      });
      setMatchId(matchId);
      router.push('/match-entry');
    } catch {
      toast.show(t('matchSetup.startFailed'));
    } finally {
      setStarting(false);
    }
  };

  // 'me' can be dragged into any seat, so the label follows whoever's there
  // rather than a fixed screen position: your seat is always "Du", the other
  // seat in your box is "Partner", the other box is "Gegner" (numbered in Doppel).
  const meInTop = topIndices.includes(slots.findIndex((s) => s === 'me'));
  const myBoxIndices = meInTop ? topIndices : botIndices;
  const oppBoxIndices = meInTop ? botIndices : topIndices;
  const labelFor = (i: number, raw: SlotValue): string => {
    if (raw === 'me') return t('matchSetup.slotYou');
    if (myBoxIndices.includes(i)) return t('matchSetup.slotPartner');
    if (!isDoubles) return t('matchSetup.slotOpponent');
    return oppBoxIndices.indexOf(i) === 0 ? t('matchSetup.slotOpponent1') : t('matchSetup.slotOpponent2');
  };

  // fixed-size channel pools (max 4 seats, Doppel), indexed by absolute seat —
  // lets the parent drive a row's drag offset / flash for either side of a swap.
  const translateYs = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];
  const flashes = [useSharedValue(0), useSharedValue(0), useSharedValue(0), useSharedValue(0)];

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [swappingIndices, setSwappingIndices] = useState<[number, number] | null>(null);
  const activeIndices: number[] = swappingIndices ?? (draggingIndex !== null ? [draggingIndex] : []);

  const rowLayout = useRef<Record<number, { top: number; height: number }>>({});
  const registerLayout = (i: number, rect: { top: number; height: number }) => {
    rowLayout.current[i] = rect;
  };
  const handleDragStart = (i: number) => setDraggingIndex(i);
  const handleDragEnd = (from: number, absoluteY: number) => {
    setDraggingIndex(null);
    let to: number | null = null;
    for (const [key, rect] of Object.entries(rowLayout.current)) {
      const idx = Number(key);
      if (idx === from) continue;
      if (absoluteY >= rect.top && absoluteY <= rect.top + rect.height) {
        to = idx;
        break;
      }
    }
    if (to === null) {
      translateYs[from].value = withSpring(0);
      return;
    }
    const target = to;
    setSwappingIndices([from, target]);

    // brief flash on both cells to mark the swap, no slide animation
    flashes[from].value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 200 }));
    flashes[target].value = withSequence(withTiming(1, { duration: 90 }), withTiming(0, { duration: 200 }));

    swapSlots(from, target);
    translateYs[from].value = 0;
    translateYs[target].value = 0;
    setSwappingIndices(null);
  };

  const q = query.trim().toLowerCase();
  const available = (friends ?? [])
    .filter((f) => !realPlayers.some((p) => p.profileId === f.profileId))
    .filter((f) => !q || f.name.toLowerCase().includes(q));
  const hasFriends = (friends?.length ?? 0) > 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader paddingBottom={26}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, minHeight: 44, justifyContent: 'space-between' }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <HeaderIconButton name="x" onPress={() => router.back()} />
            <Text style={{ fontFamily: fonts.display, fontSize: 28, color: '#fff', textTransform: 'uppercase' }}>{isDoubles ? t('matchSetup.newDoubles') : t('matchSetup.newSingles')}</Text>
          </View>
          <DisciplineToggle value={isDoubles ? 'doubles' : 'singles'} onChange={(d) => setMode(d === 'singles' ? 'Einzel' : 'Doppel')} variant="onDark" />
        </View>

        <View style={{ marginTop: 0, gap: 10 }}>
          <TeamBox
            slots={topIndices.map((i) => resolve(slots[i]))}
            rawSlots={topIndices.map((i) => slots[i])}
            labels={topIndices.map((i) => labelFor(i, slots[i]))}
            indices={topIndices}
            onRemove={removePlayer}
            activeIndices={activeIndices}
            onDragStart={handleDragStart}
            // eslint-disable-next-line react-hooks/immutability -- mutates Reanimated SharedValue.value, the documented API for driving UI-thread animation; not a React purity violation
            onDragEnd={handleDragEnd}
            registerLayout={registerLayout}
            translateYs={translateYs}
            flashes={flashes}
            boxZIndex={topIndices.some((i) => activeIndices.includes(i)) ? 10 : 1}
          />
          <TeamBox
            slots={botIndices.map((i) => resolve(slots[i]))}
            rawSlots={botIndices.map((i) => slots[i])}
            labels={botIndices.map((i) => labelFor(i, slots[i]))}
            indices={botIndices}
            onRemove={removePlayer}
            activeIndices={activeIndices}
            onDragStart={handleDragStart}
            onDragEnd={handleDragEnd}
            registerLayout={registerLayout}
            translateYs={translateYs}
            flashes={flashes}
            boxZIndex={2}
          />
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ paddingHorizontal: 16, paddingTop: 16, paddingBottom: 120 }} showsVerticalScrollIndicator={false} keyboardShouldPersistTaps="handled">
        {hasFriends ? (
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.pill, paddingHorizontal: 13, paddingVertical: 9, marginBottom: 10 }}>
            <Feather name="search" size={14} color={colors.inkMuted} />
            <TextInput
              value={query}
              onChangeText={setQuery}
              placeholder={t('matchSetup.searchFriends')}
              autoCapitalize="none"
              autoCorrect={false}
              placeholderTextColor={colors.inkMuted}
              style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.ink, padding: 0 }}
            />
          </View>
        ) : null}

        {available.length ? (
          <View style={{ gap: 8 }}>
            {available.map((f) => {
              const c = avatarColors(f.profileId);
              const disabled = realPlayers.length >= needed;
              return (
                <Pressable
                  key={f.profileId}
                  disabled={disabled}
                  onPress={() => addPlayer({ profileId: f.profileId, name: f.name, initials: f.initials, avatarUrl: f.avatarUrl, points: f.points })}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: 14, padding: 11, opacity: disabled ? 0.5 : 1 }}>
                  <Avatar initials={f.initials} uri={f.avatarUrl} size={40} bg={c.bg} fg={c.fg} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{f.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{formatPoints(f.points)} {t('common.points')}</Text>
                  </View>
                  <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: colors.courtGreen, alignItems: 'center', justifyContent: 'center' }}>
                    <Feather name="plus" size={15} color={colors.lime} />
                  </View>
                </Pressable>
              );
            })}
          </View>
        ) : (
          <Text style={{ textAlign: 'center', paddingVertical: 22, color: colors.inkMuted, fontSize: 13, lineHeight: 20, fontFamily: fonts.sans }}>
            {!hasFriends ? t('friends.empty') : q ? t('matchSetup.noFriendsFound') : t('matchSetup.allLinedUp')}
          </Text>
        )}
      </ScrollView>

      {/* Scan FAB */}
      <Pressable
        onPress={() => router.push('/scan')}
        style={{ position: 'absolute', right: 18, bottom: complete ? 94 : 18, flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: colors.courtGreen, borderRadius: 999, paddingHorizontal: 20, paddingVertical: 14, shadowColor: colors.courtGreen, shadowOpacity: 0.4, shadowRadius: 24, shadowOffset: { width: 0, height: 8 }, elevation: 8 }}>
        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke={colors.lime} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
          <Path d="M3 7V5a2 2 0 0 1 2-2h2" />
          <Path d="M17 3h2a2 2 0 0 1 2 2v2" />
          <Path d="M21 17v2a2 2 0 0 1-2 2h-2" />
          <Path d="M7 21H5a2 2 0 0 1-2-2v-2" />
          <Rect x={7} y={7} width={10} height={10} rx={1} />
        </Svg>
        <Text style={{ fontFamily: fonts.sansBold, fontSize: 15, color: colors.lime }}>{t('matchSetup.scan')}</Text>
      </Pressable>

      {/* Footer */}
      {complete ? (
        <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, backgroundColor: colors.screen, borderTopWidth: 1, borderTopColor: colors.border, paddingHorizontal: 16, paddingTop: 12, paddingBottom: 20 }}>
          <Pressable onPress={onContinue} disabled={starting} style={{ backgroundColor: colors.lime, borderRadius: radii.md, paddingVertical: 15, alignItems: 'center', opacity: starting ? 0.6 : 1 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink }}>{t('matchSetup.continue')}</Text>
          </Pressable>
        </View>
      ) : null}
    </View>
  );
}

function TeamBox({
  slots,
  rawSlots,
  labels,
  indices,
  onRemove,
  activeIndices,
  onDragStart,
  onDragEnd,
  registerLayout,
  translateYs,
  flashes,
  boxZIndex,
}: {
  slots: (DraftPlayer | null)[];
  rawSlots: SlotValue[];
  labels: string[];
  indices: number[];
  onRemove: (id: string) => void;
  activeIndices: number[];
  onDragStart: (i: number) => void;
  onDragEnd: (i: number, absoluteY: number) => void;
  registerLayout: (i: number, rect: { top: number; height: number }) => void;
  translateYs: ReturnType<typeof useSharedValue<number>>[];
  flashes: ReturnType<typeof useSharedValue<number>>[];
  boxZIndex?: number;
}) {
  return (
    <View style={{ borderRadius: 12, borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)', backgroundColor: 'rgba(255,255,255,0.05)', zIndex: boxZIndex ?? 0 }}>
      {slots.map((p, i) => {
        const globalIndex = indices[i];
        return (
          <SlotRow
            // keyed by the seat's global index, not its local position — a
            // mode toggle can remap which global seat sits at local slot 0,
            // and the row must remount so onLayout registers the new seat
            key={globalIndex}
            player={p}
            raw={rawSlots[i]}
            label={labels[i]}
            topBorder={i !== 0}
            onRemove={onRemove}
            globalIndex={globalIndex}
            isDragging={activeIndices.length === 1 && activeIndices[0] === globalIndex}
            onDragStart={onDragStart}
            onDragEnd={onDragEnd}
            registerLayout={registerLayout}
            translateY={translateYs[globalIndex]}
            flash={flashes[globalIndex]}
          />
        );
      })}
    </View>
  );
}

function SlotRow({
  player: p,
  raw,
  label,
  topBorder,
  onRemove,
  globalIndex,
  isDragging,
  onDragStart,
  onDragEnd,
  registerLayout,
  translateY,
  flash,
}: {
  player: DraftPlayer | null;
  raw: SlotValue;
  label: string;
  topBorder: boolean;
  onRemove: (id: string) => void;
  globalIndex: number;
  isDragging: boolean;
  onDragStart: (i: number) => void;
  onDragEnd: (i: number, absoluteY: number) => void;
  registerLayout: (i: number, rect: { top: number; height: number }) => void;
  translateY: ReturnType<typeof useSharedValue<number>>;
  flash: ReturnType<typeof useSharedValue<number>>;
}) {
  const rowRef = useRef<View>(null);
  const draggable = raw !== null;
  const removable = raw !== null && raw !== 'me';
  const c = p ? avatarColors(p.profileId) : null;

  const measure = () => {
    rowRef.current?.measure((_x, _y, _w, height, _pageX, pageY) => {
      registerLayout(globalIndex, { top: pageY, height });
    });
  };

  const pan = Gesture.Pan()
    .enabled(draggable)
    .onStart(() => runOnJS(onDragStart)(globalIndex))
    .onUpdate((e) => {
      // eslint-disable-next-line react-hooks/immutability -- mutates Reanimated SharedValue.value (a parent-owned drag channel), the documented API for driving UI-thread animation
      translateY.value = e.translationY;
    })
    .onEnd((e) => runOnJS(onDragEnd)(globalIndex, e.absoluteY));

  const animatedStyle = useAnimatedStyle(
    () => ({
      transform: [{ translateY: translateY.value }, { scale: withTiming(isDragging ? 1.03 : 1) }],
      zIndex: isDragging ? 10 : 0,
      backgroundColor: isDragging ? 'rgba(0,0,0,0.35)' : 'transparent',
      borderRadius: isDragging ? 10 : 0,
    }),
    [isDragging]
  );

  const flashStyle = useAnimatedStyle(() => ({ opacity: flash.value }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View
        ref={rowRef}
        onLayout={measure}
        style={[
          { flexDirection: 'row', alignItems: 'center', gap: 11, paddingHorizontal: 12, paddingVertical: 9, borderTopWidth: topBorder ? 1 : 0, borderTopColor: 'rgba(255,255,255,0.10)' },
          animatedStyle,
        ]}>
        <Animated.View pointerEvents="none" style={[{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: colors.lime }, flashStyle]} />
        {p ? (
          <Avatar initials={p.initials} uri={p.avatarUrl} size={38} bg={c!.bg} fg={c!.fg} />
        ) : (
          <View style={{ width: 38, height: 38, borderRadius: 19, borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.28)', borderStyle: 'dashed' }} />
        )}
        <Text style={{ flex: 1, fontFamily: p ? fonts.sansSemiBold : fonts.sansMedium, fontSize: 15, color: p ? '#fff' : 'rgba(255,255,255,0.4)' }}>
          {p ? p.name : label}
        </Text>
        {p && removable ? (
          <Pressable onPress={() => onRemove(p.profileId)} style={{ width: 26, height: 26, borderRadius: 13, backgroundColor: 'rgba(255,255,255,0.1)', alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="x" size={14} color="#fff" />
          </Pressable>
        ) : null}
      </Animated.View>
    </GestureDetector>
  );
}
