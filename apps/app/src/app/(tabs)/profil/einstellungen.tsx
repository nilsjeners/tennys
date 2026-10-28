import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Modal, Platform, Pressable, ScrollView, Text, View } from 'react-native';
import * as Device from 'expo-device';
import Constants from 'expo-constants';

import { api } from '@convex/_generated/api';
import { authClient } from '@/lib/auth-client';
import { Avatar } from '@/components/ui/Avatar';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { Toggle } from '@/components/ui/Toggle';
import { useToast } from '@/components/ui/Toast';
import { LOCALE_CODES, useI18n, type LanguagePreference } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

type Icon = React.ComponentProps<typeof Feather>['name'];

export default function Einstellungen() {
  const router = useRouter();
  const toast = useToast();
  const { t, preference, setPreference } = useI18n();
  const me = useQuery(api.users.me, {});
  const deleteAccount = useMutation(api.users.deleteAccount);
  const registerPushToken = useMutation(api.notifications.registerPushToken);
  const [push, setPush] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [languageSheet, setLanguageSheet] = useState(false);

  // Reflect the real OS permission state, not an assumed default.
  // expo-notifications is dynamically imported: on web/SSR (Device.isDevice
  // false) the module is never touched, avoiding its localStorage crash there.
  useEffect(() => {
    if (Platform.OS === 'web' || !Device.isDevice) return;
    (async () => {
      const Notifications = await import('expo-notifications');
      const { status } = await Notifications.getPermissionsAsync();
      setPush(status === 'granted');
    })();
  }, []);

  // There's no in-app "off" for OS push permissions — turning it off only
  // makes sense via system settings. Turning it on (re)requests + registers.
  const onTogglePush = async () => {
    if (push) {
      toast.show(t('settings.pushDisableHint'), 'info');
      return;
    }
    if (Platform.OS === 'web' || !Device.isDevice) return;
    const Notifications = await import('expo-notifications');
    const { status } = await Notifications.requestPermissionsAsync();
    if (status !== 'granted') {
      toast.show(t('settings.pushEnableHint'), 'info');
      return;
    }
    setPush(true);
    const projectId = Constants.expoConfig?.extra?.eas?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    await registerPushToken({ token, platform: Platform.OS });
  };

  const signOut = async () => {
    await authClient.signOut();
    // Navigate straight to Welcome instead of the root gate ('/'): right after
    // sign-out, the Convex auth flag can take a render or two to flip to
    // unauthenticated, so routing through index.tsx's isAuthenticated check
    // can still see the stale "true" value and bounce back into the tabs.
    router.replace('/(auth)/welcome');
  };

  // GDPR deletion: double-opt-in modal → anonymize profile + drop app user.
  const onDeleteConfirmed = async () => {
    setDeleting(true);
    try {
      await deleteAccount({});
      await authClient.signOut();
      router.replace('/(auth)/welcome');
    } catch {
      setDeleting(false);
      setConfirmDelete(false);
      toast.show(t('settings.deleteFailed'));
    }
  };

  const languageLabel = (p: LanguagePreference) => t(p ? `language.${p}` : 'language.system');
  const pickLanguage = (p: LanguagePreference) => {
    setPreference(p);
    setLanguageSheet(false);
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header
        title={t('settings.title')}
        onBack={() => router.back()}
        trailing={
          <Pressable onPress={() => router.back()}>
            <Avatar initials={me?.profile?.displayName?.slice(0, 2).toUpperCase() ?? 'DU'} uri={me?.avatarUrl} size={28} />
          </Pressable>
        }
      />

      <ScrollView contentContainerStyle={{ paddingVertical: 16 }} showsVerticalScrollIndicator={false}>
        <GroupLabel>{t('settings.groupAccount')}</GroupLabel>
        <Group>
          <Row icon="user" label={t('settings.editProfile')} chevron onPress={() => router.push('/(tabs)/profil/edit')} />
          <Row icon="mail" label={t('settings.email')} value={me?.email ?? '…'} />
          <Row icon="lock" label={t('settings.changePassword')} chevron last />
        </Group>

        <GroupLabel>{t('settings.groupNotifications')}</GroupLabel>
        <Group>
          <Row icon="bell" label={t('settings.push')} toggle toggleOn={push} onToggle={onTogglePush} last />
        </Group>

        <GroupLabel>{t('settings.groupLanguage')}</GroupLabel>
        <Group>
          <Row icon="globe" label={t('settings.language')} value={languageLabel(preference)} chevron onPress={() => setLanguageSheet(true)} last />
        </Group>

        <GroupLabel>{t('settings.groupLegal')}</GroupLabel>
        <Group>
          <Row icon="file-text" label={t('settings.terms')} chevron onPress={() => router.push('/legal/agb')} />
          <Row icon="shield" label={t('settings.privacy')} chevron onPress={() => router.push('/legal/datenschutz')} />
          <Row icon="help-circle" label={t('settings.help')} chevron last />
        </Group>

        {/* danger zone (bottom, red) */}
        <Group>
          <Pressable onPress={signOut} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: 1, borderBottomColor: colors.border, opacity: pressed ? 0.7 : 1 })}>
            <Feather name="log-out" size={18} color={colors.red} />
            <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.red }}>{t('settings.signOut')}</Text>
          </Pressable>
          <Pressable onPress={() => setConfirmDelete(true)} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 13, opacity: pressed ? 0.7 : 1 })}>
            <Feather name="trash-2" size={18} color={colors.redDark} />
            <Text style={{ flex: 1, fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.redDark }}>{t('settings.deleteAccount')}</Text>
          </Pressable>
        </Group>
      </ScrollView>

      {/* double-opt-in confirmation (works on web too, unlike Alert.alert) */}
      <Modal visible={confirmDelete} transparent animationType="fade" onRequestClose={() => setConfirmDelete(false)}>
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <View style={{ width: '100%', maxWidth: 360, backgroundColor: colors.white, borderRadius: radii.lg, padding: 22 }}>
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink, marginBottom: 8 }}>{t('settings.deleteTitle')}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, lineHeight: 21, marginBottom: 18 }}>
              {t('settings.deleteBody')}
            </Text>
            <PrimaryButton label={t('settings.deleteConfirm')} onPress={onDeleteConfirmed} loading={deleting} style={{ backgroundColor: colors.redDark }} />
            <Pressable onPress={() => setConfirmDelete(false)} disabled={deleting} style={{ alignItems: 'center', paddingVertical: 14 }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.inkSecondary }}>{t('common.cancel')}</Text>
            </Pressable>
          </View>
        </View>
      </Modal>

      {/* language picker — same bottom sheet convention as the photo source sheet */}
      <Modal visible={languageSheet} transparent animationType="slide" onRequestClose={() => setLanguageSheet(false)}>
        <Pressable onPress={() => setLanguageSheet(false)} style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'flex-end' }}>
          <View style={{ paddingBottom: 34, paddingHorizontal: 12 }}>
            <View style={{ backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden' }}>
              {([null, ...LOCALE_CODES] as LanguagePreference[]).map((p, i) => (
                <Pressable
                  key={p ?? 'system'}
                  onPress={() => pickLanguage(p)}
                  style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 20, paddingVertical: 16, borderTopWidth: i === 0 ? 0 : 1, borderTopColor: colors.border }}>
                  <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink }}>{languageLabel(p)}</Text>
                  {preference === p ? <Feather name="check" size={18} color={colors.courtGreen} /> : null}
                </Pressable>
              ))}
            </View>
            <View style={{ marginTop: 8, backgroundColor: colors.white, borderRadius: radii.lg, overflow: 'hidden' }}>
              <Pressable onPress={() => setLanguageSheet(false)} style={{ paddingHorizontal: 20, paddingVertical: 16, alignItems: 'center' }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.inkSecondary }}>{t('common.cancel')}</Text>
              </Pressable>
            </View>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

function GroupLabel({ children }: { children: string }) {
  return (
    <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.8, textTransform: 'uppercase', color: colors.inkMuted, marginBottom: 8, paddingHorizontal: 20 }}>
      {children}
    </Text>
  );
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={{ backgroundColor: colors.white, marginBottom: 18, ...cardShadow }}>{children}</View>;
}

function Row({ icon, label, value, chevron, toggle, toggleOn, onToggle, onPress, last }: { icon: Icon; label: string; value?: string; chevron?: boolean; toggle?: boolean; toggleOn?: boolean; onToggle?: (v: boolean) => void; onPress?: () => void; last?: boolean }) {
  const content = (
    <>
      <Feather name={icon} size={18} color={colors.courtGreen} />
      <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 14, color: colors.ink }}>{label}</Text>
      {value ? <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkMuted }}>{value}</Text> : null}
      {chevron ? <Feather name="chevron-right" size={16} color={colors.chevron} /> : null}
      {toggle ? <Toggle value={!!toggleOn} onValueChange={onToggle} /> : null}
    </>
  );
  const style = { flexDirection: 'row' as const, alignItems: 'center' as const, gap: 12, paddingHorizontal: 20, paddingVertical: 13, borderBottomWidth: last ? 0 : 1, borderBottomColor: colors.border };
  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [style, { opacity: pressed ? 0.6 : 1 }]}>
        {content}
      </Pressable>
    );
  }
  return <View style={style}>{content}</View>;
}

const cardShadow = {
  shadowColor: '#000',
  shadowOpacity: 0.07,
  shadowRadius: 3,
  shadowOffset: { width: 0, height: 1 },
  elevation: 2,
} as const;
