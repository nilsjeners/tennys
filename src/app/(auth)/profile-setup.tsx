import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation } from 'convex/react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { colors, fonts, radii } from '@/theme/tokens';

const LEVELS: { label: string; value: 'beginner' | 'intermediate' | 'pro' }[] = [
  { label: 'Anfänger', value: 'beginner' },
  { label: 'Mittel', value: 'intermediate' },
  { label: 'Profi', value: 'pro' },
];

export default function ProfileSetup() {
  const router = useRouter();
  const createProfile = useMutation(api.users.createProfile);
  const seed = useMutation(api.seed.run);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [level, setLevel] = useState(1);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const submit = async () => {
    if (!displayName.trim() || !username.trim()) return setError('Bitte Name und Benutzername eingeben.');
    setBusy(true);
    setError(null);
    try {
      await createProfile({ displayName: displayName.trim(), username: username.trim().replace(/^@/, ''), skillLevel: LEVELS[level].value });
      await seed({});
      router.replace('/(auth)/done');
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Konnte Profil nicht speichern.');
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Dein Profil</Text>
        </View>
      </DarkHeader>

      <View style={{ flex: 1, padding: 24 }}>
        <View style={{ alignItems: 'center', marginBottom: 26 }}>
          <View style={{ width: 96, height: 96, borderRadius: 48, backgroundColor: colors.white, borderWidth: 2, borderStyle: 'dashed', borderColor: colors.borderStrong, alignItems: 'center', justifyContent: 'center' }}>
            <Feather name="camera" size={30} color={colors.inkMuted} />
            <View style={{ position: 'absolute', bottom: 0, right: 0, width: 30, height: 30, borderRadius: 15, backgroundColor: colors.lime, alignItems: 'center', justifyContent: 'center', borderWidth: 3, borderColor: colors.screen }}>
              <Feather name="plus" size={14} color={colors.ink} />
            </View>
          </View>
          <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.inkSecondary, marginTop: 10 }}>Foto hinzufügen</Text>
        </View>

        <SectionLabel>Anzeigename</SectionLabel>
        <View style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16 }}>
          <TextInput value={displayName} onChangeText={setDisplayName} placeholder="Anna Berg" placeholderTextColor={colors.inkMuted} style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }} />
        </View>

        <SectionLabel>Benutzername</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14, marginBottom: 16 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted }}>@</Text>
          <TextInput value={username} onChangeText={setUsername} placeholder="annaberg" autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkMuted} style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0, marginLeft: 2 }} />
        </View>

        <SectionLabel>Spielstärke (LK)</SectionLabel>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 24 }}>
          {LEVELS.map((l, i) => {
            const active = i === level;
            return (
              <Pressable key={l.value} onPress={() => setLevel(i)} style={{ flex: 1, alignItems: 'center', backgroundColor: active ? colors.courtGreen : colors.white, borderWidth: active ? 0 : 1.5, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: 10 }}>
                <Text style={{ fontFamily: active ? fonts.sansSemiBold : fonts.sans, fontSize: 14, color: active ? colors.lime : colors.inkSecondary }}>{l.label}</Text>
              </Pressable>
            );
          })}
        </View>

        {error && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.redDark, marginBottom: 12 }}>{error}</Text>}

        <View style={{ flex: 1 }} />
        <PrimaryButton label={busy ? 'Speichern…' : 'Profil speichern'} onPress={busy ? undefined : submit} />
      </View>
    </View>
  );
}
