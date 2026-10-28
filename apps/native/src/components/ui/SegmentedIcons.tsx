import { Pressable, View } from 'react-native';
import { colors } from '@/theme/tokens';

export type SegState = { fill: string; stroke: string; bg: string };
export type SegVariant = 'onDark' | 'onLight';

// Colors for an icon segment (matches the prototype's modeIcon()).
export function segColors(active: boolean, variant: SegVariant = 'onDark'): SegState {
  if (variant === 'onLight') {
    return active
      ? { fill: 'none', stroke: colors.courtGreen, bg: colors.lime }
      : { fill: 'none', stroke: colors.inkMuted, bg: colors.white };
  }
  return active
    ? { fill: 'rgba(201,241,53,0.35)', stroke: colors.lime, bg: 'rgba(201,241,53,0.14)' }
    : { fill: 'none', stroke: 'rgba(255,255,255,0.4)', bg: 'rgba(255,255,255,0.05)' };
}

// Two-segment icon toggle used for Einzel/Doppel and Spieler/Team switches.
// `renderIcon` receives the segment's active state so callers can draw an SVG.
export function SegmentedIcons({
  activeIndex,
  onChange,
  renderLeft,
  renderRight,
  leftWidth = 32,
  rightWidth = 36,
  variant = 'onDark',
}: {
  activeIndex: 0 | 1;
  onChange: (i: 0 | 1) => void;
  renderLeft: (s: SegState) => React.ReactNode;
  renderRight: (s: SegState) => React.ReactNode;
  leftWidth?: number;
  rightWidth?: number;
  variant?: SegVariant;
}) {
  const left = segColors(activeIndex === 0, variant);
  const right = segColors(activeIndex === 1, variant);
  return (
    <View
      style={{
        flexDirection: 'row',
        borderRadius: 10,
        overflow: 'hidden',
        borderWidth: variant === 'onLight' ? 1.5 : 0,
        borderColor: colors.border,
      }}>
      <Pressable
        onPress={() => onChange(0)}
        style={{ width: leftWidth, height: 28, backgroundColor: left.bg, alignItems: 'center', justifyContent: 'center' }}>
        {renderLeft(left)}
      </Pressable>
      <Pressable
        onPress={() => onChange(1)}
        style={{ width: rightWidth, height: 28, backgroundColor: right.bg, alignItems: 'center', justifyContent: 'center' }}>
        {renderRight(right)}
      </Pressable>
    </View>
  );
}
