import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { authClient } from '@/lib/auth-client';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Login() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [hidden, setHidden] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!email || !password) return setError('Bitte E-Mail und Passwort eingeben.');
    setBusy(true);
    setError(null);
    const { error } = await authClient.signIn.email({ email, password });
    setBusy(false);
    if (error) return setError(error.message ?? 'Anmeldung fehlgeschlagen.');
    router.replace('/'); // gate routes to tabs / profile-setup
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Anmelden</Text>
        </View>
      </DarkHeader>

      <View style={{ flex: 1, padding: 24 }}>
        <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: colors.inkSecondary, marginBottom: 24, lineHeight: 21 }}>
          Willkommen zurück.
        </Text>

        <SectionLabel>E-Mail</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
          <Feather name="mail" size={17} color={colors.inkMuted} />
          <TextInput value={email} onChangeText={setEmail} placeholder="anna.berg@mail.de" keyboardType="email-address" autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkMuted} style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }} />
        </View>

        <View style={{ height: 18 }} />
        <SectionLabel>Passwort</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
          <Feather name="lock" size={17} color={colors.inkMuted} />
          <TextInput value={password} onChangeText={setPassword} placeholder="••••••••" secureTextEntry={hidden} autoCapitalize="none" placeholderTextColor={colors.inkMuted} style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }} />
          <Pressable onPress={() => setHidden((h) => !h)} hitSlop={8}>
            <Feather name={hidden ? 'eye' : 'eye-off'} size={18} color={colors.inkMuted} />
          </Pressable>
        </View>

        {error && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.redDark, marginTop: 16 }}>{error}</Text>}

        <View style={{ flex: 1 }} />
        <PrimaryButton label={busy ? 'Moment…' : 'Anmelden'} onPress={busy ? undefined : submit} />
      </View>
    </View>
  );
}
