import { Pressable, Text, type ViewStyle } from 'react-native';
import { colors, fonts, radii } from '@/theme/tokens';

type Props = {
  label: string;
  onPress?: () => void;
  /** dark green on lime screens vs lime on light screens — default lime */
  variant?: 'lime' | 'dark' | 'white';
  style?: ViewStyle;
};

export function PrimaryButton({ label, onPress, variant = 'lime', style }: Props) {
  const bg = variant === 'lime' ? colors.lime : variant === 'dark' ? colors.courtGreen : colors.white;
  const fg = variant === 'dark' ? colors.lime : colors.ink;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          width: '100%',
          backgroundColor: bg,
          borderRadius: radii.md,
          paddingVertical: 16,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.85 : 1,
        },
        style,
      ]}>
      <Text style={{ color: fg, fontFamily: fonts.sansBold, fontSize: 16 }}>{label}</Text>
    </Pressable>
  );
}
