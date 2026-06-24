import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, Text, TextInput, View } from 'react-native';

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

export default function EditProfile() {
  const router = useRouter();
  const me = useQuery(api.users.me, {});
  const updateProfile = useMutation(api.users.updateProfile);

  const [displayName, setDisplayName] = useState('');
  const [username, setUsername] = useState('');
  const [city, setCity] = useState('');
  const [level, setLevel] = useState(1);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Prefill once the profile loads.
  useEffect(() => {
    if (me?.profile && !ready) {
      setDisplayName(me.profile.displayName);
      setUsername(me.profile.username ?? '');
      setCity(me.profile.city ?? '');
      const idx = LEVELS.findIndex((l) => l.value === me.profile?.skillLevel);
      setLevel(idx >= 0 ? idx : 1);
      setReady(true);
    }
  }, [me, ready]);

  const save = async () => {
    if (!displayName.trim() || !username.trim()) return setError('Bitte Name und Benutzername eingeben.');
    setBusy(true);
    setError(null);
    try {
      await updateProfile({
        displayName: displayName.trim(),
        username: username.trim(),
        city: city.trim() || undefined,
        skillLevel: LEVELS[level].value,
      });
      router.back();
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
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Profil bearbeiten</Text>
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 24 }} showsVerticalScrollIndicator={false}>
        <SectionLabel>Anzeigename</SectionLabel>
        <Input value={displayName} onChangeText={setDisplayName} placeholder="Anna Berg" />

        <View style={{ height: 16 }} />
        <SectionLabel>Benutzername</SectionLabel>
        <View style={{ flexDirection: 'row', alignItems: 'center', backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
          <Text style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.inkMuted }}>@</Text>
          <TextInput value={username} onChangeText={setUsername} placeholder="annaberg" autoCapitalize="none" autoCorrect={false} placeholderTextColor={colors.inkMuted} style={{ flex: 1, fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0, marginLeft: 2 }} />
        </View>

        <View style={{ height: 16 }} />
        <SectionLabel>Stadt</SectionLabel>
        <Input value={city} onChangeText={setCity} placeholder="München" />

        <View style={{ height: 16 }} />
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

        <PrimaryButton label={busy ? 'Speichern…' : 'Speichern'} onPress={busy ? undefined : save} />
      </ScrollView>
    </View>
  );
}

function Input(props: React.ComponentProps<typeof TextInput>) {
  return (
    <View style={{ backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.border, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 14 }}>
      <TextInput placeholderTextColor={colors.inkMuted} {...props} style={{ fontFamily: fonts.sans, fontSize: 15, color: colors.ink, padding: 0 }} />
    </View>
  );
}
