import { Feather } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, Text, TextInput, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { PrimaryButton } from '@/components/ui/PrimaryButton';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { avatarColors, skillLabel } from '@/lib/format';
import { colors, fonts, radii } from '@/theme/tokens';

type SetRow = { mine: string; theirs: string };

export default function MatchCreate() {
  const router = useRouter();
  const players = useQuery(api.players.list, {});
  const createMatch = useMutation(api.matches.create);

  const [oppIndex, setOppIndex] = useState(0);
  const [sets, setSets] = useState<SetRow[]>([{ mine: '', theirs: '' }, { mine: '', theirs: '' }]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const opponent = players && players.length ? players[oppIndex % players.length] : null;
  const oppFirstName = opponent?.name.split(' ')[0] ?? 'Gegner';

  const setScore = (i: number, key: keyof SetRow, val: string) => {
    const v = val.replace(/[^0-9]/g, '').slice(0, 2);
    setSets((s) => s.map((row, idx) => (idx === i ? { ...row, [key]: v } : row)));
  };

  const save = async () => {
    if (!opponent) return setError('Kein Gegner verfügbar.');
    const parsed = sets
      .filter((s) => s.mine !== '' && s.theirs !== '')
      .map((s) => ({ myGames: Number(s.mine), theirGames: Number(s.theirs) }));
    if (parsed.length === 0) return setError('Bitte mindestens einen Satz eintragen.');
    setBusy(true);
    setError(null);
    try {
      await createMatch({ opponentProfileId: opponent.profileId as never, sets: parsed });
      router.back();
    } catch (e) {
      setBusy(false);
      setError(e instanceof Error ? e.message : 'Konnte Match nicht speichern.');
    }
  };

  const c = opponent ? avatarColors(opponent.profileId) : { bg: colors.courtGreen, fg: colors.lime };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="x" onPress={() => router.back()} />
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff' }}>Match erfassen</Text>
        </View>
      </DarkHeader>

      <View style={{ flex: 1, padding: 22 }}>
        <View style={{ flexDirection: 'row', gap: 6, marginBottom: 22 }}>
          <View style={{ flex: 1, height: 4, borderRadius: radii.pill, backgroundColor: colors.lime }} />
          <View style={{ flex: 1, height: 4, borderRadius: radii.pill, backgroundColor: colors.lime }} />
          <View style={{ flex: 1, height: 4, borderRadius: radii.pill, backgroundColor: colors.border }} />
        </View>

        <SectionLabel>Gegner</SectionLabel>
        <Pressable
          onPress={() => players && setOppIndex((i) => i + 1)}
          style={{ flexDirection: 'row', alignItems: 'center', gap: 11, backgroundColor: colors.white, borderWidth: 1.5, borderColor: colors.lime, borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 12, marginBottom: 24 }}>
          <Avatar initials={opponent?.initials ?? '?'} size={36} bg={c.bg} fg={c.fg} />
          <View style={{ flex: 1 }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 15, color: colors.ink }}>{opponent?.name ?? 'Kein Spieler'}</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>
              {opponent ? `${skillLabel(opponent.skillLevel)} · tippen zum Wechseln` : 'Lege zuerst Spieler an'}
            </Text>
          </View>
          <Feather name="check" size={18} color={colors.limeDark} />
        </Pressable>

        <SectionLabel>Ergebnis</SectionLabel>
        <Card style={{ padding: 16, marginBottom: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
            <View style={{ width: 54 }} />
            <Text style={{ flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>Du</Text>
            <Text style={{ flex: 1, textAlign: 'center', fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{oppFirstName}</Text>
          </View>

          {sets.map((row, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <Text style={{ width: 54, fontFamily: fonts.sansSemiBold, fontSize: 11, letterSpacing: 0.5, textTransform: 'uppercase', color: colors.inkMuted }}>Satz {i + 1}</Text>
              <ScoreInput value={row.mine} mine onChange={(v) => setScore(i, 'mine', v)} />
              <ScoreInput value={row.theirs} onChange={(v) => setScore(i, 'theirs', v)} />
            </View>
          ))}

          <Pressable onPress={() => setSets((s) => [...s, { mine: '', theirs: '' }])} style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.borderStrong, borderRadius: radii.sm, paddingVertical: 11, opacity: pressed ? 0.7 : 1 })}>
            <Feather name="plus" size={15} color={colors.inkSecondary} />
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.inkSecondary }}>Satz hinzufügen</Text>
          </Pressable>
        </Card>

        {error && <Text style={{ fontFamily: fonts.sansMedium, fontSize: 13, color: colors.redDark, marginBottom: 12 }}>{error}</Text>}

        <PrimaryButton label={busy ? 'Speichern…' : 'Match speichern'} onPress={busy ? undefined : save} />
      </View>
    </View>
  );
}

function ScoreInput({ value, mine, onChange }: { value: string; mine?: boolean; onChange: (v: string) => void }) {
  return (
    <View style={{ flex: 1, backgroundColor: mine ? colors.courtGreen : colors.screen, borderWidth: mine ? 0 : 1.5, borderColor: colors.border, borderRadius: radii.sm, paddingVertical: 6, alignItems: 'center' }}>
      <TextInput
        value={value}
        onChangeText={onChange}
        keyboardType="number-pad"
        maxLength={2}
        placeholder="–"
        placeholderTextColor={mine ? 'rgba(201,241,53,0.4)' : colors.inkMuted}
        style={{ fontFamily: fonts.display, fontSize: 24, color: mine ? colors.lime : colors.ink, textAlign: 'center', minWidth: 40, padding: 0 }}
      />
    </View>
  );
}
