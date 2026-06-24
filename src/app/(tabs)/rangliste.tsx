import { useQuery } from 'convex/react';
import { useState } from 'react';
import { ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { Card } from '@/components/ui/Card';
import { DarkHeader } from '@/components/ui/DarkHeader';
import { FilterPill } from '@/components/ui/FilterPill';
import { avatarColors } from '@/lib/format';
import { colors, fonts } from '@/theme/tokens';

type RankEntry = {
  rank: number;
  profileId: string;
  name: string;
  initials: string;
  wins: number;
  pct: number;
  you: boolean;
};

const FILTERS = ['Freunde', 'Region', 'Liga'];

export default function Rangliste() {
  const [filter, setFilter] = useState(0);
  const ranking = useQuery(api.players.ranking, {});

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <Text style={{ fontFamily: fonts.display, fontSize: 28, color: '#fff' }}>Rangliste</Text>
        <View style={{ flexDirection: 'row', gap: 8, marginTop: 12 }}>
          {FILTERS.map((f, i) => (
            <FilterPill key={f} label={f} active={i === filter} variant="onDark" onPress={() => setFilter(i)} />
          ))}
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <Card flush>
          {ranking?.length ? (
            ranking.map((e, i) => <RankRow key={e.profileId} entry={e} last={i === ranking.length - 1} />)
          ) : (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, padding: 16 }}>Noch keine Platzierungen.</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function RankRow({ entry, last }: { entry: RankEntry; last: boolean }) {
  const { rank, you } = entry;
  const av = you ? { bg: colors.courtGreen, fg: colors.lime } : avatarColors(entry.profileId);
  const circleBg = rank === 1 ? colors.lime : rank === 2 ? colors.border : you ? '#FFE2D8' : 'transparent';
  const circleBorder = rank >= 4 && !you ? 1.5 : 0;
  const circleText = rank >= 4 && !you ? colors.inkMuted : colors.ink;

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 12,
        paddingHorizontal: 14,
        paddingVertical: 13,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
        backgroundColor: you ? colors.limeWash : 'transparent',
      }}>
      <View style={{ width: 28, height: 28, borderRadius: 14, backgroundColor: circleBg, borderWidth: circleBorder, borderColor: colors.border, alignItems: 'center', justifyContent: 'center' }}>
        <Text style={{ fontFamily: fonts.display, fontSize: 14, color: circleText }}>{rank}</Text>
      </View>
      <Avatar initials={entry.initials} size={38} bg={av.bg} fg={av.fg} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: you ? fonts.sansBold : fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>
          {entry.name}
          {you && <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}> (du)</Text>}
        </Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{entry.wins} Siege</Text>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 18, color: you ? colors.courtGreen : colors.inkSecondary }}>{entry.pct}%</Text>
    </View>
  );
}
