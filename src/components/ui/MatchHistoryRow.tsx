import { Text, View } from 'react-native';
import { Avatar } from '@/components/ui/Avatar';
import { ResultBadge } from '@/components/ui/Badge';
import { colors, fonts } from '@/theme/tokens';

export type HistoryEntry = {
  initials: string;
  bg: string;
  fg: string;
  name: string;
  sub: string;
  score: string;
  win: boolean;
};

// One row in a "Letzte Matches" list card (Home + Profil).
export function MatchHistoryRow({ entry, last }: { entry: HistoryEntry; last?: boolean }) {
  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 11,
        paddingHorizontal: 14,
        paddingVertical: 12,
        borderBottomWidth: last ? 0 : 1,
        borderBottomColor: colors.border,
      }}>
      <Avatar initials={entry.initials} size={34} bg={entry.bg} fg={entry.fg} />
      <View style={{ flex: 1 }}>
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink }}>{entry.name}</Text>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{entry.sub}</Text>
      </View>
      <Text style={{ fontFamily: fonts.display, fontSize: 15, color: colors.ink }}>{entry.score}</Text>
      <ResultBadge win={entry.win} />
    </View>
  );
}
