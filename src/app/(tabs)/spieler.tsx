import { Feather } from '@expo/vector-icons';
import { useMutation, useQuery } from 'convex/react';
import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { DarkHeader } from '@/components/ui/DarkHeader';
import { FilterPill } from '@/components/ui/FilterPill';
import { avatarColors, skillLabel } from '@/lib/format';
import { colors, fonts, radii } from '@/theme/tokens';

const FILTERS = ['In der Nähe', 'Gleiche LK', 'Online'];

export default function Spieler() {
  const [filter, setFilter] = useState(0);
  const players = useQuery(api.players.list, {});
  const challenge = useMutation(api.players.challenge);
  const [challenged, setChallenged] = useState<Record<string, boolean>>({});

  const onChallenge = async (id: string) => {
    setChallenged((c) => ({ ...c, [id]: true }));
    try {
      await challenge({ profileId: id as never });
    } catch {
      setChallenged((c) => ({ ...c, [id]: false }));
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: '#fff', marginBottom: 12 }}>Spieler finden</Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: radii.md, paddingHorizontal: 14, paddingVertical: 11 }}>
          <Feather name="search" size={17} color="rgba(255,255,255,0.6)" />
          <Text style={{ fontFamily: fonts.sans, fontSize: 14, color: 'rgba(255,255,255,0.6)' }}>Name, Verein oder Ort…</Text>
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingTop: 14 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', gap: 8, marginBottom: 14 }}>
          {FILTERS.map((f, i) => (
            <FilterPill key={f} label={f} active={i === filter} onPress={() => setFilter(i)} />
          ))}
        </View>

        <View style={{ gap: 10 }}>
          {players?.length ? (
            players.map((p) => {
              const c = avatarColors(p.profileId);
              const done = challenged[p.profileId];
              return (
                <Card key={p.profileId} style={{ flexDirection: 'row', alignItems: 'center', gap: 11, padding: 13 }}>
                  <Avatar initials={p.initials} size={42} bg={c.bg} fg={c.fg} />
                  <View style={{ flex: 1 }}>
                    <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{p.name}</Text>
                    <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{skillLabel(p.skillLevel)}</Text>
                  </View>
                  <Pressable
                    disabled={done}
                    onPress={() => onChallenge(p.profileId)}
                    style={({ pressed }) => ({ backgroundColor: done ? colors.border : colors.courtGreen, borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 8, opacity: pressed ? 0.85 : 1 })}>
                    <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: done ? colors.inkSecondary : colors.lime }}>{done ? 'Angefragt' : 'Herausfordern'}</Text>
                  </Pressable>
                </Card>
              );
            })
          ) : (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted }}>Keine Spieler gefunden.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
