import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Avatar } from '@/components/ui/Avatar';
import { SearchInput } from '@/components/ui/SearchInput';
import { Header, SubHeaderBar } from '@/components/ui/Header';
import { NotificationBell } from '@/components/ui/NotificationBell';
import { useToast } from '@/components/ui/Toast';
import { avatarColors, formatPoints } from '@/lib/format';
import { useT, type TFunction } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

type Status = 'friends' | 'pending_out' | 'pending_in' | 'none';

export default function Freunde() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [query, setQuery] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const players = useQuery(api.friends.browse, {});
  const request = useMutation(api.friends.request);
  const accept = useMutation(api.friends.accept);
  // optimistic overrides while the mutation is in flight
  const [override, setOverride] = useState<Record<string, Status>>({});

  const q = query.trim().toLowerCase();
  const searching = q.length > 0;
  const all = (players ?? []).map((p) => ({ ...p, status: override[p.profileId] ?? p.status }));
  const rows = searching
    ? all.filter((p) => p.name.toLowerCase().includes(q) || p.city?.toLowerCase().includes(q))
    : all.filter((p) => p.status === 'friends');

  const onRequest = async (profileId: string) => {
    setOverride((o) => ({ ...o, [profileId]: 'pending_out' }));
    try {
      const res = await request({ profileId: profileId as Id<'playerProfiles'> });
      if (res.status === 'friends') {
        setOverride((o) => ({ ...o, [profileId]: 'friends' }));
        toast.show(t('friends.nowFriends'), 'success');
      }
    } catch {
      setOverride((o) => ({ ...o, [profileId]: 'none' }));
      toast.show(t('friends.requestFailed'));
    }
  };

  const onAccept = async (profileId: string, connectionId: string | null) => {
    if (!connectionId) return;
    setOverride((o) => ({ ...o, [profileId]: 'friends' }));
    try {
      await accept({ connectionId: connectionId as Id<'connections'> });
      toast.show(t('friends.nowFriends'), 'success');
    } catch {
      setOverride((o) => ({ ...o, [profileId]: 'pending_in' }));
      toast.show(t('friends.acceptFailed'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('friends.title')} trailing={<NotificationBell />} />
      <SubHeaderBar>
        <SearchInput value={query} onChangeText={setQuery} placeholder={t('friends.searchPlaceholder')} />
      </SubHeaderBar>

      <ScrollView
        contentContainerStyle={{ padding: 16, gap: 10 }}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); setTimeout(() => setRefreshing(false), 600); }} />}>
        {!searching ? (
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.inkMuted, paddingHorizontal: 4 }}>
            {t('friends.yours')}
          </Text>
        ) : null}

        {rows.length ? (
          rows.map((p) => {
            const c = avatarColors(p.profileId);
            return (
              <Pressable
                key={p.profileId}
                onPress={() => router.push(`/player/${p.profileId}`)}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: 11,
                  backgroundColor: colors.white,
                  padding: 13,
                  borderRadius: radii.lg,
                  shadowColor: '#000',
                  shadowOpacity: 0.07,
                  shadowRadius: 3,
                  shadowOffset: { width: 0, height: 1 },
                  elevation: 2,
                }}>
                <Avatar initials={p.initials} uri={p.avatarUrl} size={42} bg={c.bg} fg={c.fg} />
                <View style={{ flex: 1, minWidth: 0 }}>
                  <Text numberOfLines={1} style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{p.name}</Text>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>
                    {formatPoints(p.points)}{p.city ? ` · ${p.city}` : ''}
                  </Text>
                </View>
                <StatusAction status={p.status} t={t} onRequest={() => onRequest(p.profileId)} onAccept={() => onAccept(p.profileId, p.connectionId)} />
              </Pressable>
            );
          })
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 32, gap: 10 }}>
            <Feather name={searching ? 'search' : 'users'} size={28} color={colors.inkMuted} />
            <Text style={{ textAlign: 'center', color: colors.inkSecondary, fontFamily: fonts.sans, fontSize: 13, lineHeight: 20, maxWidth: 280 }}>
              {searching ? (players ? t('friends.noneFound') : ' ') : t('friends.empty')}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

function StatusAction({ status, t, onRequest, onAccept }: { status: Status; t: TFunction; onRequest: () => void; onAccept: () => void }) {
  if (status === 'friends') {
    return (
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5, paddingHorizontal: 10, paddingVertical: 8 }}>
        <Feather name="check" size={14} color={colors.limeText} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.limeText }}>{t('friends.statusFriends')}</Text>
      </View>
    );
  }
  if (status === 'pending_out') {
    return (
      <View style={{ backgroundColor: colors.limeWash, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.limeText }}>{t('friends.statusRequested')}</Text>
      </View>
    );
  }
  if (status === 'pending_in') {
    return (
      <Pressable onPress={onAccept} style={{ backgroundColor: colors.lime, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink }}>{t('friends.accept')}</Text>
      </Pressable>
    );
  }
  return (
    <Pressable onPress={onRequest} style={{ backgroundColor: colors.courtGreen, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8 }}>
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.lime }}>{t('friends.request')}</Text>
    </Pressable>
  );
}
