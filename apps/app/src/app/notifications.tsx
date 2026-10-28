import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useRouter } from 'expo-router';
import { useEffect, useRef } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import type { Id } from '@convex/_generated/dataModel';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { useToast } from '@/components/ui/Toast';
import { avatarColors, matchDateLabel } from '@/lib/format';
import { useI18n } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Notifications() {
  const router = useRouter();
  const toast = useToast();
  const { t, locale } = useI18n();
  const items = useQuery(api.notifications.list, {});
  const markAllRead = useMutation(api.notifications.markAllRead);
  const accept = useMutation(api.friends.accept);
  const decline = useMutation(api.friends.decline);
  const marked = useRef(false);

  // mark as read once the list has loaded (badge clears reactively)
  useEffect(() => {
    if (items && !marked.current) {
      marked.current = true;
      markAllRead({});
    }
  }, [items, markAllRead]);

  const onAccept = async (connectionId: Id<'connections'>) => {
    try {
      await accept({ connectionId });
      toast.show(t('friends.nowFriends'), 'success');
    } catch {
      toast.show(t('friends.acceptFailed'));
    }
  };
  const onDecline = async (connectionId: Id<'connections'>) => {
    try {
      await decline({ connectionId });
    } catch {
      toast.show(t('friends.declineFailed'));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('notifications.title')} onBack={() => router.back()} />

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        {items?.length ? (
          <View style={{ backgroundColor: colors.white }}>
            {items.map((n, i) => {
              const c = avatarColors(n.actorName ?? n.id);
              return (
                <Pressable
                  key={n.id}
                  onPress={() => (n.matchId ? router.push(`/match/${n.matchId}`) : undefined)}
                  style={{
                    flexDirection: 'row',
                    alignItems: 'center',
                    gap: 11,
                    paddingHorizontal: 20,
                    paddingVertical: 13,
                    borderBottomWidth: i === items.length - 1 ? 0 : 1,
                    borderBottomColor: colors.border,
                    backgroundColor: n.isRead ? colors.white : colors.limeWash,
                  }}>
                  <Avatar initials={n.actorInitials} uri={n.actorAvatarUrl} size={38} bg={c.bg} fg={c.fg} />
                  <View style={{ flex: 1, minWidth: 0 }}>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.ink, lineHeight: 18 }}>
                      <Text style={{ fontFamily: fonts.sansSemiBold }}>{n.actorName ?? t('common.someone')}</Text> {t(`notifications.${n.type}`)}
                    </Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted, marginTop: 2 }}>{matchDateLabel(n.createdAt, t, locale)}</Text>
                  </View>
                  {n.type === 'friend_request' && n.pending && n.connectionId ? (
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                      <Pressable
                        onPress={() => onAccept(n.connectionId as Id<'connections'>)}
                        style={{ backgroundColor: colors.lime, borderRadius: radii.pill, paddingHorizontal: 12, paddingVertical: 7 }}>
                        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.ink }}>{t('friends.accept')}</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => onDecline(n.connectionId as Id<'connections'>)}
                        style={{ width: 30, height: 30, borderRadius: 15, backgroundColor: colors.border, alignItems: 'center', justifyContent: 'center', alignSelf: 'center' }}>
                        <Feather name="x" size={14} color={colors.inkSecondary} />
                      </Pressable>
                    </View>
                  ) : n.matchId ? (
                    <Feather name="chevron-right" size={16} color={colors.chevron} />
                  ) : null}
                </Pressable>
              );
            })}
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: 40, gap: 10 }}>
            <Feather name="bell" size={28} color={colors.inkMuted} />
            <Text style={{ color: colors.inkSecondary, fontFamily: fonts.sans, fontSize: 13 }}>
              {items ? t('notifications.empty') : ' '}
            </Text>
          </View>
        )}
      </ScrollView>
    </View>
  );
}
