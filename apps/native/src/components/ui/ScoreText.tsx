import { Text, type TextProps, type TextStyle } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

type Props = Omit<TextProps, 'style'> & {
  /** font size — the ONLY way to build hierarchy besides color (single font weight) */
  size: number;
  /** defaults to ink; use muted tones / opacity for de-emphasis */
  color?: string;
  /** optional line height override; defaults to `size` for tight numeric rows */
  lineHeight?: number;
  /** extra text styles (letterSpacing etc.) — fontFamily/-weight are locked */
  style?: Omit<TextStyle, 'fontFamily' | 'fontWeight' | 'fontSize' | 'color' | 'lineHeight'>;
};

// The one and only way to render numbers/scores (PRD: Bebas Neue exclusively).
// Bebas has a single weight, so hierarchy comes strictly from `size` + `color`.
export function ScoreText({ size, color = colors.ink, lineHeight, style, children, ...rest }: Props) {
  return (
    <Text {...rest} style={[{ fontFamily: fonts.display, fontSize: size, lineHeight: lineHeight ?? size, color }, style]}>
      {children}
    </Text>
  );
}
