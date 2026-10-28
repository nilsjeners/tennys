import { Feather } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { DarkHeader, HeaderIconButton } from '@/components/ui/Header';
import { StatTile } from '@/components/ui/StatTile';
import { WinLossBar } from '@/components/ui/WinLossBar';
import { avatarColors, formatPoints } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;

export default function TeamLounge() {
  const router = useRouter();
  const t = useT();
  const { pair } = useLocalSearchParams<{ pair: string }>();
  const [aId, bId] = (pair ?? '').split('_') as [string, string];
  const team = useQuery(api.teams.forPair, aId && bId ? { a: aId as Id<'playerProfiles'>, b: bId as Id<'playerProfiles'> } : 'skip');
  const setMeta = useMutation(api.teams.setTeamMeta);

  const [editing, setEditing] = useState(false);
  const [draftName, setDraftName] = useState('');

  if (!team) return <View style={{ flex: 1, backgroundColor: colors.screen }} />;

  const [pa, pb] = team.players;
  const ca = avatarColors(pa.profileId);
  const cb = avatarColors(pb.profileId);

  const saveName = async () => {
    await setMeta({ a: aId as Id<'playerProfiles'>, b: bId as Id<'playerProfiles'>, teamName: draftName.trim() || undefined });
    setEditing(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader paddingBottom={24}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14, marginBottom: 18 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>{t('team.title')}</Text>
        </View>
        <View style={{ alignItems: 'center', gap: 10 }}>
          <AvatarStack a={{ ...ca, initials: pa.initials, uri: pa.avatarUrl }} b={{ ...cb, initials: pb.initials, uri: pb.avatarUrl }} size={72} border={colors.courtGreen} />
          {editing ? (
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <TextInput
                value={draftName}
                onChangeText={setDraftName}
                placeholder={t('team.namePlaceholder')}
                placeholderTextColor="rgba(255,255,255,0.4)"
                autoFocus
                style={{ minWidth: 160, borderBottomWidth: 1.5, borderColor: colors.lime, color: '#fff', fontFamily: fonts.display, fontSize: 26, paddingVertical: 2, textAlign: 'center' }}
              />
              <Pressable onPress={saveName} hitSlop={8}>
                <Feather name="check" size={22} color={colors.lime} />
              </Pressable>
            </View>
          ) : (
            <Pressable
              onPress={() => { if (team.unlocked) { setDraftName(team.hasCustomName ? team.teamName : ''); setEditing(true); } }}
              style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <Text style={{ fontFamily: fonts.display, fontSize: 28, color: colors.lime }}>{team.teamName}</Text>
              {team.unlocked ? <Feather name="edit-2" size={15} color="rgba(255,255,255,0.5)" /> : null}
            </Pressable>
          )}
          <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.55)' }}>
            {t('team.strength')} <Text style={{ fontFamily: fonts.sansBold, color: '#fff' }}>{formatPoints(team.strength)}</Text>
          </Text>
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {!team.unlocked ? (
          <View style={{ backgroundColor: colors.white, marginHorizontal: 16, borderRadius: radii.lg, padding: 20, alignItems: 'center', gap: 10, ...cardShadow }}>
            <Feather name="lock" size={24} color={colors.inkMuted} />
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink, textAlign: 'center' }}>{t('team.locked')}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkSecondary, textAlign: 'center', lineHeight: 19 }}>
              {t('team.lockedHint', { n: team.unlockAt - team.sharedMatches })}
            </Text>
            <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
              {Array.from({ length: team.unlockAt }).map((_, i) => (
                <View key={i} style={{ width: 28, height: 6, borderRadius: 3, backgroundColor: i < team.sharedMatches ? colors.lime : colors.border }} />
              ))}
            </View>
          </View>
        ) : (
          <>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flex: 1 }}><StatTile tone="court" label={t('team.together')} value={String(team.wins + team.losses)} sub={t('team.togetherSub')} /></View>
              <View style={{ flex: 1 }}><StatTile tone="courtLight" label={t('team.wins')} value={String(team.wins)} sub={t('team.winsSub', { pct: team.pct })} /></View>
            </View>
            <View style={{ flexDirection: 'row', gap: 10, paddingHorizontal: 16, marginBottom: 14 }}>
              <View style={{ flex: 1 }}><StatTile tone="courtLight" label={t('team.streak')} value={String(team.streak)} sub={t('team.streakSub')} /></View>
              <View style={{ flex: 1 }}><StatTile tone="court" label={t('team.games')} value={`${team.gamesFor}:${team.gamesAgainst}`} sub={t('team.gamesSub')} /></View>
            </View>

            <View style={{ backgroundColor: colors.white, marginHorizontal: 16, paddingHorizontal: 20, paddingVertical: 14, borderRadius: radii.lg, marginBottom: 14, ...cardShadow }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>{t('balance.title')}</Text>
              <WinLossBar wins={team.wins} losses={team.losses} compact />
            </View>
          </>
        )}

        {/* members */}
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 8, paddingHorizontal: 20 }}>{t('team.players')}</Text>
        <View style={{ backgroundColor: colors.white, ...cardShadow }}>
          {team.players.map((pl, i) => {
            const c = avatarColors(pl.profileId);
            return (
              <Pressable
                key={pl.profileId}
                onPress={() => router.push(`/player/${pl.profileId}`)}
                style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: i === team.players.length - 1 ? 0 : 1, borderBottomColor: colors.border }}>
                <Avatar initials={pl.initials} uri={pl.avatarUrl} size={40} bg={c.bg} fg={c.fg} />
                <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{pl.name}</Text>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.inkSecondary }}>{formatPoints(pl.rating)}</Text>
                <Feather name="chevron-right" size={16} color={colors.chevron} />
              </Pressable>
            );
          })}
        </View>
      </ScrollView>
    </View>
  );
}
