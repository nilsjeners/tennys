import { Text, View } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Props = {
  initials: string;
  size?: number;
  bg?: string;
  fg?: string;
  /** use Bebas Neue (e.g. profile header) instead of DM Sans */
  display?: boolean;
};

export function Avatar({ initials, size = 38, bg = colors.courtGreen, fg = colors.lime, display }: Props) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: radius(size),
        backgroundColor: bg,
        alignItems: 'center',
        justifyContent: 'center',
      }}>
      <Text
        style={{
          color: fg,
          fontFamily: display ? fonts.display : fonts.sansBold,
          fontSize: display ? size * 0.36 : Math.max(11, size * 0.32),
        }}>
        {initials}
      </Text>
    </View>
  );
}

const radius = (s: number) => s / 2;
