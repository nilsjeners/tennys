import { Text, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

// Uppercase muted label that precedes most content groups.
export function SectionLabel({ children, style }: { children: string; style?: TextStyle }) {
  return (
    <Text
      style={[
        {
          fontFamily: fonts.sansSemiBold,
          fontSize: 11,
          letterSpacing: 0.8,
          textTransform: 'uppercase',
          color: colors.inkMuted,
          marginBottom: 8,
        },
        style,
      ]}>
      {children}
    </Text>
  );
}
