import { ActivityIndicator, Pressable, Text, View, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  /** dark green on lime screens vs lime on light screens — default lime */
  variant?: 'lime' | 'dark' | 'white';
  /** visually dims the button and blocks presses (e.g. form incomplete) */
  disabled?: boolean;
  /** request in flight — shows an in-button spinner (PRD) and blocks presses */
  loading?: boolean;
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = 'lime', disabled, loading, style }: Props) {
  const bg = variant === 'lime' ? colors.lime : variant === 'dark' ? colors.courtGreen : colors.white;
  const fg = variant === 'dark' ? colors.lime : colors.ink;
  const blocked = disabled || loading;
  return (
    <Pressable
      onPress={blocked ? undefined : onPress}
      disabled={blocked}
      style={({ pressed }) => [
        {
          width: '100%',
          backgroundColor: bg,
          borderRadius: radii.md,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: disabled && !loading ? 0.5 : pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
        {loading ? <ActivityIndicator size="small" color={fg} /> : null}
        <Text style={{ color: fg, fontFamily: fonts.sansBold, fontSize: 16 }}>{label}</Text>
      </View>
    </Pressable>
  );
}
