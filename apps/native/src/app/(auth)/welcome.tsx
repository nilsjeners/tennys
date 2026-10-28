import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { GoogleLogo } from '@/components/ui/GoogleLogo';
import { Logo } from '@/components/ui/Logo';
import { useToast } from '@/components/ui/Toast';
import { authClient } from '@/lib/auth-client';
import { friendlyErrorMessage } from '@/lib/errorMessages';
import { useT } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Welcome() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [busy, setBusy] = useState(false);

  const signInWithGoogle = async () => {
    setBusy(true);
    try {
      const { error } = await authClient.signIn.social({ provider: 'google', callbackURL: '/' });
      if (error) {
        toast.show(friendlyErrorMessage(error, t('auth.login.failed'), t));
        return;
      }
      router.replace('/');
    } catch (e) {
      toast.show(friendlyErrorMessage(e, t('auth.login.failed'), t));
    } finally {
      setBusy(false);
    }
  };

  const signInWithApple = async () => {
    setBusy(true);
    try {
      const { error } = await authClient.signIn.social({ provider: 'apple', callbackURL: '/' });
      if (error) {
        toast.show(friendlyErrorMessage(error, t('auth.login.failed'), t));
        return;
      }
      router.replace('/');
    } catch (e) {
      toast.show(friendlyErrorMessage(e, t('auth.login.failed'), t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.courtGreen }}>
      <SafeAreaView style={{ flex: 1 }}>
        <View style={{ flex: 1, paddingHorizontal: 26, paddingTop: 36, paddingBottom: 36, justifyContent: 'space-between', overflow: 'hidden' }}>
          {/* decorative rings */}
          <View style={{ position: 'absolute', top: -60, right: -70, width: 240, height: 240, borderRadius: 120, borderWidth: 2, borderColor: 'rgba(201,241,53,0.12)' }} />
          <View style={{ position: 'absolute', bottom: 120, left: -80, width: 200, height: 200, borderRadius: 100, borderWidth: 2, borderColor: 'rgba(201,241,53,0.08)' }} />

          <View style={{ marginTop: 36 }}>
            <View style={{ width: 64, height: 64, borderRadius: 18, overflow: 'hidden', marginBottom: 22 }}>
              <Logo size={64} />
            </View>
            <Text style={{ fontFamily: fonts.display, fontSize: 64, color: colors.lime, letterSpacing: -1, lineHeight: 64 }}>tennys</Text>
            <Text style={{ fontFamily: fonts.sansMedium, fontSize: 18, color: '#fff', lineHeight: 25, marginTop: 14, maxWidth: 260 }}>
              {t('auth.welcome.tagline')}
            </Text>
          </View>

          <View style={{ gap: 10 }}>
            <SocialButton icon={<Ionicons name="logo-apple" size={17} color={colors.ink} />} label={t('auth.welcome.apple')} onPress={signInWithApple} disabled={busy} />
            <SocialButton icon={<GoogleLogo size={17} />} label={t('auth.welcome.google')} onPress={signInWithGoogle} disabled={busy} />

            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginVertical: 6 }}>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
              <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.45)' }}>{t('auth.welcome.or')}</Text>
              <View style={{ flex: 1, height: 1, backgroundColor: 'rgba(255,255,255,0.15)' }} />
            </View>

            <Pressable
              onPress={() => router.push('/(auth)/signup')}
              style={({ pressed }) => ({ width: '100%', backgroundColor: colors.lime, borderRadius: radii.md, paddingVertical: 16, alignItems: 'center', opacity: pressed ? 0.85 : 1 })}>
              <Text style={{ fontFamily: fonts.sansBold, fontSize: 16, color: colors.ink }}>{t('auth.welcome.signupEmail')}</Text>
            </Pressable>

            <Text style={{ textAlign: 'center', fontFamily: fonts.sans, fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 6 }}>
              {t('auth.welcome.already')}{' '}
              <Text onPress={() => router.push('/(auth)/login')} style={{ color: colors.lime, fontFamily: fonts.sansSemiBold }}>
                {t('auth.welcome.login')}
              </Text>
            </Text>
            {/* legally required for social logins (PRD) */}
            <Text style={{ textAlign: 'center', fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 8, lineHeight: 16 }}>
              {t('auth.welcome.legalPrefix')}{' '}
              <Text onPress={() => router.push('/legal/agb')} style={{ color: colors.lime, fontFamily: fonts.sansSemiBold }}>
                {t('auth.welcome.terms')}
              </Text>{' '}
              {t('auth.welcome.legalAnd')}{' '}
              <Text onPress={() => router.push('/legal/datenschutz')} style={{ color: colors.lime, fontFamily: fonts.sansSemiBold }}>
                {t('auth.welcome.privacy')}
              </Text>
              {t('auth.welcome.legalSuffix')}
            </Text>
          </View>
        </View>
      </SafeAreaView>
    </View>
  );
}

function SocialButton({ icon, label, onPress, disabled }: { icon: React.ReactNode; label: string; onPress?: () => void; disabled?: boolean }) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 9, width: '100%', backgroundColor: '#fff', borderRadius: radii.md, paddingVertical: 15, opacity: pressed || disabled ? 0.6 : 1 })}>
      {icon}
      <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink }}>{label}</Text>
    </Pressable>
  );
}
