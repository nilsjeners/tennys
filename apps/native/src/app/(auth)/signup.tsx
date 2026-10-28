import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, Pressable, Text, TextInput, View } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { Header } from '@/components/ui/Header';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { useToast } from '@/components/ui/Toast';
import { friendlyErrorMessage } from '@/lib/errorMessages';
import { isValidEmail } from '@/lib/format';
import { useT } from '@/lib/i18n';
import { colors, fonts, radii } from '@/theme/tokens';

const MIN_PASSWORD_LENGTH = 8;

export default function Signup() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);

  // inline format validation → red outline (PRD)
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const passwordInvalid = password.length > 0 && password.length < MIN_PASSWORD_LENGTH;
  const canSubmit = email.trim().length > 0 && password.length >= MIN_PASSWORD_LENGTH && !emailInvalid && accepted;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { error } = await authClient.signUp.email({ email: email.trim(), password, name: email.split('@')[0] });
      if (error) {
        toast.show(friendlyErrorMessage(error, t('auth.signup.failed'), t));
        return;
      }
      router.replace('/(auth)/profile-setup');
    } catch (e) {
      toast.show(friendlyErrorMessage(e, t('auth.signup.failed'), t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('auth.signup.title')} onBack={() => router.back()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, marginBottom: 24, lineHeight: 21 }}>
            {t('auth.signup.subtitle')}
          </Text>

          <SectionLabel>{t('auth.login.email')}</SectionLabel>
          <Field icon="mail" invalid={emailInvalid}>
            <TextInput
              value={email}
              onChangeText={setEmail}
              placeholder="anna.berg@mail.de"
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
              editable={!busy}
              placeholderTextColor={colors.inkMuted}
              style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
            />
          </Field>

          <View style={{ height: 18 }} />
          <SectionLabel>{t('auth.login.password')}</SectionLabel>
          <Field icon="lock" invalid={passwordInvalid}>
            <TextInput
              value={password}
              onChangeText={setPassword}
              placeholder="••••••••"
              secureTextEntry={hidden}
              autoCapitalize="none"
              editable={!busy}
              placeholderTextColor={colors.inkMuted}
              style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
            />
            <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
              <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.inkMuted} />
            </Pressable>
          </Field>
          {passwordInvalid ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.redDark, marginTop: 6 }}>
              {t('auth.signup.minChars', { n: MIN_PASSWORD_LENGTH })}
            </Text>
          ) : null}

          <View style={{ height: 24 }} />
          <Pressable onPress={() => setAccepted((a) => !a)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
            <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: accepted ? colors.lime : colors.white, borderWidth: accepted ? 0 : 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
              {accepted && <Feather name="check" size={13} color={colors.ink} />}
            </View>
            <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.inkSecondary, lineHeight: 19 }}>
              {t('auth.signup.acceptPrefix')}{' '}
              <Text onPress={() => router.push('/legal/agb')} style={{ color: colors.courtGreenLight, fontFamily: fonts.sansSemiBold }}>
                {t('auth.signup.terms')}
              </Text>{' '}
              {t('auth.signup.and')}{' '}
              <Text onPress={() => router.push('/legal/datenschutz')} style={{ color: colors.courtGreenLight, fontFamily: fonts.sansSemiBold }}>
                {t('auth.signup.privacy')}
              </Text>
              {t('auth.signup.acceptSuffix')}
            </Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          {/* stays disabled until the form is valid (PRD) */}
          <PrimaryButton label={t('auth.signup.submit')} onPress={submit} disabled={!canSubmit} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}

function Field({ icon, invalid, children }: { icon: React.ComponentProps<typeof Feather>['name']; invalid?: boolean; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: invalid ? colors.red : colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
      <Feather name={icon} size={17} color={colors.inkMuted} />
      {children}
    </View>
  );
}
