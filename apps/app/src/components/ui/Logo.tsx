import Svg, { Circle, ClipPath, Defs, G, Path, Rect } from 'react-native-svg';

type Props = { size?: number };

// The Tennys brand mark: a tennis ball on a dark tile. Use this everywhere the
// app shows its logo (onboarding, splash-style screens) instead of any other mark.
export function Logo({ size = 64 }: Props) {
  return (
    <Svg width={size} height={size} viewBox="0 0 400 400">
      <Defs>
        <ClipPath id="tennysBallClip">
          <Circle cx={200} cy={200} r={130} />
        </ClipPath>
      </Defs>
      <Rect width={400} height={400} fill="#253F36" />
      <G clipPath="url(#tennysBallClip)">
        <Rect width={400} height={400} fill="#A4BA25" />
        <Circle cx={188} cy={188} r={130} fill="#C4D82D" />
        <Circle cx={175} cy={175} r={115} fill="#DDF242" />
        <Path d="M 50 155 C 130 210, 210 70, 340 130" fill="none" stroke="#253F36" strokeWidth={14} strokeLinecap="round" />
        <Path d="M 60 280 C 190 330, 270 190, 350 245" fill="none" stroke="#253F36" strokeWidth={14} strokeLinecap="round" />
      </G>
    </Svg>
  );
}
