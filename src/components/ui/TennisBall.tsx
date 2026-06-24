import Svg, { Circle, Path } from 'react-native-svg';
import { colors } from '@/theme/tokens';

type Props = {
  size?: number;
  ball?: string;
  line?: string;
};

// The Tennys mark: a tennis ball with two seam curves.
export function TennisBall({ size = 24, ball = colors.lime, line = colors.courtGreen }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <Circle cx={12} cy={12} r={10} fill={ball} />
      <Path d="M3.5 7.5 Q9 3 14 4 Q19.5 4.5 21 9" stroke={line} strokeWidth={1.4} fill="none" strokeLinecap="round" />
      <Path d="M3 15 Q4.5 19.5 10 20 Q15 21 20.5 16.5" stroke={line} strokeWidth={1.4} fill="none" strokeLinecap="round" />
    </Svg>
  );
}
