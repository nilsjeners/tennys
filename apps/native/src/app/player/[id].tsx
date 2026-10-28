import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Alert, Pressable, ScrollView, Text, View } from 'react-native';
import Animated, { SlideInRight } from 'react-native-reanimated';

import { api } from '@repo/backend/convex/_generated/api';
import type { Id } from '@repo/backend/convex/_generated/dataModel';
import { Header } from '@/components/ui/Header';
import { DisciplineToggle, type Discipline } from '@/components/ui/DisciplineToggle';
import { AvatarMenuButton, ProfileHero, KpiRow } from '@/components/ui/ProfileHero';
import { ScoreText } from '@/components/ui/ScoreText';
import { TabBar } from '@/components/ui/TabBar';
import { useToast } from '@/components/ui/Toast';
import { cardShadow, ProfileStats } from '@/components/profile/ProfileStats';
import { avatarColors } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

// Other player's profile — same stats block as the own profile. The avatar's
// "…" menu replaces the gear with follow / unfollow (friends.ts).
export default function PlayerProfile() {
  const router = useRouter();
  const { t } = useI18n();
  const toast = useToast();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [discipline, setDiscipline] = useState<Discipline>('singles');
  const [menuOpen, setMenuOpen] = useState(false);
  const profileId = id as Id<'playerProfiles'>;
  const p = useQuery(api.players.profile, { profileId, discipline });
  const activity = useQuery(api.players.activityAndSets, { profileId, discipline });
  const history = useQuery(api.matches.historyForPlayer, { profileId, limit: 8, discipline });
  const friendStatus = useQuery(api.friends.statusWith, { profileId });
  const request = useMutation(api.friends.request);
  const accept = useMutation(api.friends.accept);
  const remove = useMutation(api.friends.remove);
  const c = avatarColors(id);

  const onFollow = async () => {
    setMenuOpen(false);
    try {
      await request({ profileId });
      toast.show(t('friends.nowFriends'), 'success');
    } catch {
      toast.show(t('friends.requestFailed'));
    }
  };

  const onAccept = async () => {
    setMenuOpen(false);
    if (!friendStatus?.connectionId) return;
    try {
      await accept({ connectionId: friendStatus.connectionId as Id<'connections'> });
      toast.show(t('friends.nowFriends'), 'success');
    } catch {
      toast.show(t('friends.acceptFailed'));
    }
  };

  const onUnfollow = () => {
    setMenuOpen(false);
    if (!friendStatus?.connectionId) return;
    Alert.alert(t('friends.unfollowConfirmTitle'), t('friends.unfollowConfirmBody'), [
      { text: t('common.cancel'), style: 'cancel' },
      {
        text: t('friends.unfollow'),
        style: 'destructive',
        onPress: async () => {
          try {
            await remove({ connectionId: friendStatus.connectionId as Id<'connections'> });
          } catch {
            toast.show(t('friends.unfollowFailed'));
          }
        },
      },
    ]);
  };

  const stats = [
    { value: String(p?.matches ?? 0), label: t('kpi.matches') },
    { value: String(p?.wins ?? 0), label: t('kpi.wins') },
    { value: `${p?.pct ?? 0}%`, label: t('kpi.rate') },
    { value: String(p?.streak ?? 0), label: t('kpi.streak') },
  ];

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={p?.name ?? ''}
        onBack={() => router.back()}
        trailing={<DisciplineToggle value={discipline} onChange={setDiscipline} variant="onDark" />}
      />

      <Animated.View entering={SlideInRight} style={{ flex: 1 }}>
      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ paddingBottom: 24 }}>
        <ProfileHero
          name={p?.name ?? ' '}
          points={p?.points ?? 0}
          avatarUrl={p?.avatarUrl}
          initials={p?.initials ?? '–'}
          avatarBg={c.bg}
          avatarFg={c.fg}
          avatarMenu={
            <View>
              <AvatarMenuButton name="more-horizontal" onPress={() => setMenuOpen((v) => !v)} />
              {menuOpen ? (
                <View style={{ position: 'absolute', top: 40, right: 0, minWidth: 190, backgroundColor: colors.white, borderRadius: radii.md, paddingVertical: 4, ...cardShadow }}>
                  {friendStatus?.status === 'friends' ? (
                    <MenuRow label={t('friends.unfollow')} onPress={onUnfollow} />
                  ) : friendStatus?.status === 'pending_in' ? (
                    <MenuRow label={t('friends.accept')} onPress={onAccept} />
                  ) : friendStatus?.status === 'pending_out' ? (
                    <MenuRow label={t('friends.statusRequested')} />
                  ) : (
                    <MenuRow label={t('friends.follow')} onPress={onFollow} />
                  )}
                </View>
              ) : null}
            </View>
          }
        />
        <KpiRow stats={stats} />

        <View style={{ paddingVertical: 16, gap: 14 }}>
          <ProfileStats
            wins={p?.wins ?? 0}
            losses={(p?.matches ?? 0) - (p?.wins ?? 0)}
            points={p?.points ?? 0}
            series={p?.series ?? [{ value: 1000 }]}
            activity={activity}
            recentMatches={history}
            onOpenMatch={(id) => router.push(`/match/${id}`)}
            beforeSets={
              <View style={{ backgroundColor: colors.white, paddingHorizontal: 20, paddingVertical: 16, ...cardShadow }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 4 }}>{t('profile.rankLabel')}</Text>
                <ScoreText size={34}>#{p?.rank ?? '–'}</ScoreText>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted, marginTop: 3 }}>
                  {t(discipline === 'singles' ? 'profile.rankOfSingles' : 'profile.rankOfDoubles', { total: p?.rankTotal ?? '–' })}
                </Text>
              </View>
            }
          />
        </View>
      </ScrollView>
      </Animated.View>

      <TabBar standalone />
    </View>
  );
}

function MenuRow({ label, onPress }: { label: string; onPress?: () => void }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={!onPress}
      style={{ paddingHorizontal: 16, paddingVertical: 12, opacity: onPress ? 1 : 0.5 }}>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
