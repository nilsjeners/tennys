import { Text, View } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

// Win/Loss pill used in match history rows.
export function ResultBadge({ win }: { win: boolean }) {
  return (
    <View
      style={{
        backgroundColor: win ? colors.limeDark : colors.red,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: radii.pill,
      }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: win ? colors.courtGreen : '#fff' }}>
        {win ? 'S' : 'N'}
      </Text>
    </View>
  );
}

// Small uppercase status tag, e.g. GEPLANT (blue) or LIVE (red).
export function StatusTag({
  label,
  color = colors.blue,
  bg = colors.blueWash,
}: {
  label: string;
  color?: string;
  bg?: string;
}) {
  return (
    <View style={{ backgroundColor: bg, paddingHorizontal: 9, paddingVertical: 4, borderRadius: radii.pill }}>
      <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, letterSpacing: 0.4, color }}>{label}</Text>
    </View>
  );
}
