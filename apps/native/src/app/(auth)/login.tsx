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

export default function Login() {
  const router = useRouter();
  const toast = useToast();
  const t = useT();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  // inline format validation → red outline (PRD)
  const emailInvalid = email.trim().length > 0 && !isValidEmail(email);
  const canSubmit = email.trim().length > 0 && password.length > 0 && !emailInvalid;

  const submit = async () => {
    if (!canSubmit) return;
    setBusy(true);
    try {
      const { error } = await authClient.signIn.email({ email: email.trim(), password });
      if (error) {
        toast.show(friendlyErrorMessage(error, t('auth.login.failed'), t));
        return;
      }
      router.replace('/'); // gate routes to tabs / profile-setup
    } catch (e) {
      toast.show(friendlyErrorMessage(e, t('auth.login.failed'), t));
    } finally {
      setBusy(false);
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <Header title={t('auth.login.title')} onBack={() => router.back()} />

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <View style={{ flex: 1, padding: 24 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, marginBottom: 24, lineHeight: 21 }}>
            {t('auth.login.subtitle')}
          </Text>

          <SectionLabel>{t('auth.login.email')}</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: emailInvalid ? colors.red : colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
            <Feather name="mail" size={17} color={colors.inkMuted} />
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
          </View>

          <View style={{ height: 18 }} />
          <SectionLabel>{t('auth.login.password')}</SectionLabel>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
            <Feather name="lock" size={17} color={colors.inkMuted} />
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
          </View>

          <Pressable onPress={() => toast.show(t('auth.login.forgotSoon'), 'info')} hitSlop={6} style={{ alignSelf: 'flex-start', marginTop: 10 }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.courtGreenLight }}>{t('auth.login.forgot')}</Text>
          </Pressable>

          <View style={{ flex: 1 }} />
          {/* stays disabled until both fields are filled (PRD) */}
          <PrimaryButton label={t('auth.login.title')} onPress={submit} disabled={!canSubmit} loading={busy} />
        </View>
      </KeyboardAvoidingView>
    </View>
  );
}
