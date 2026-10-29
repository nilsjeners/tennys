import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

// Dark KPI tile used on the Stats grid. Two tones alternate (court / court-light).
export function StatTile({
  label,
  value,
  sub,
  tone = 'court',
}: {
  label: string;
  value: string;
  sub?: string;
  tone?: 'court' | 'courtLight';
}) {
  return (
    <View style={{ flex: 1, backgroundColor: tone === 'court' ? colors.courtGreen : colors.courtGreenLight, padding: 14 }}>
      <Text
        style={{
          fontFamily: fonts.sansSemiBold,
          fontSize: 10,
          letterSpacing: 0.6,
          textTransform: 'uppercase',
          color: 'rgba(255,255,255,0.45)',
          marginBottom: 4,
        }}>
        {label}
      </Text>
      <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.lime, lineHeight: 36 }}>{value}</Text>
      {sub ? <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{sub}</Text> : null}
    </View>
  );
}
