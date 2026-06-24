import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Signup() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [accepted, setAccepted] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) return setError('Bitte E-Mail und Passwort eingeben.');
    if (!accepted) return setError('Bitte die Bedingungen akzeptieren.');
    setBusy(true);
    setError(null);
    const { error } = await authClient.signUp.email({ email, password, name: email.split('@')[0] });
    setBusy(false);
    if (error) return setError(error.message ?? 'Registrierung fehlgeschlagen.');
    router.replace('/(auth)/profile-setup');
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Konto erstellen</Text>
        </View>
      </DarkHeader>

      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, marginBottom: 24, lineHeight: 21 }}>
          Erstelle dein Konto in wenigen Sekunden.
        </Text>

        <SectionLabel>E-Mail</SectionLabel>
        <Field icon="mail">
          <TextInput
            value={email}
            onChangeText={setEmail}
            placeholder="anna.berg@mail.de"
            keyboardType="email-address"
            autoCapitalize="none"
            autoCorrect={false}
            placeholderTextColor={colors.inkMuted}
            style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
          />
        </Field>

        <View style={{ height: 18 }} />
        <SectionLabel>Passwort</SectionLabel>
        <Field icon="lock">
          <TextInput
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
            secureTextEntry={hidden}
            autoCapitalize="none"
            placeholderTextColor={colors.inkMuted}
            style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }}
          />
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.inkMuted} />
          </Pressable>
        </Field>

        <View style={{ height: 24 }} />
        <Pressable onPress={() => setAccepted((a) => !a)} style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 10, marginBottom: 12 }}>
          <View style={{ width: 22, height: 22, borderRadius: 6, backgroundColor: accepted ? colors.lime : colors.white, borderWidth: accepted ? 0 : 1.5, borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center', marginTop: 1 }}>
            {accepted && <Feather name="check" size={13} color={colors.ink} />}
          </View>
          <Text style={{ flex: 1, fontFamily: fonts.sans, fontSize: 13, color: colors.inkSecondary, lineHeight: 19 }}>
            Ich akzeptiere die <Text style={{ color: colors.courtGreenLight, fontFamily: fonts.sansSemiBold }}>Nutzungsbedingungen</Text> und{' '}
            <Text style={{ color: colors.courtGreenLight, fontFamily: fonts.sansSemiBold }}>Datenschutz</Text>.
          </Text>
        </Pressable>

        {error && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.redDark, marginBottom: 12 }}>{error}</Text>}

        <View style={{ flex: 1 }} />
        <PrimaryButton label={busy ? 'Moment…' : 'Weiter'} onPress={busy ? undefined : submit} />
      </View>
    </View>
  );
}

function Field({ icon, children }: { icon: React.ComponentProps<typeof Feather>['name']; children: React.ReactNode }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
      <Feather name={icon} size={17} color={colors.inkMuted} />
      {children}
    </View>
  );
}
