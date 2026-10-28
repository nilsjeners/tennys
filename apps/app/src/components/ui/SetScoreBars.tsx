import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

// Column bar chart: one bar per set score, height proportional to its
// percentage of all won/lost sets. Used for the profile's set-score breakdown.
export function SetScoreBars({ data, color, barMaxHeight = 70 }: { data: { score: string; pct: number }[]; color: string; barMaxHeight?: number }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6 }}>
      {data.map((d) => (
        <View key={d.score} style={{ flex: 1, alignItems: 'center' }}>
          <Text style={{ fontFamily: fonts.mono, fontSize: 10, color: colors.inkSecondary, marginBottom: 4 }}>{d.pct}%</Text>
          <View style={{ width: '100%', height: Math.max(3, (d.pct / 100) * barMaxHeight), backgroundColor: color, borderRadius: 4 }} />
          <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.inkMuted, marginTop: 4 }}>{d.score}</Text>
        </View>
      ))}
    </View>
  );
}
