import Svg, { Circle, Ellipse, G, Line, Path } from 'react-native-svg';

type IconProps = { size?: number; color?: string; fill?: string };

// Single player (person) — used in Spieler/Team toggle + match-detail.
export function PersonIcon({ size = 20, color = '#fff', fill = 'none' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20a8 6 0 0 1 16 0z" />
    </Svg>
  );
}

// Team (two people).
export function TeamIcon({ size = 20, color = '#fff', fill = 'none' }: IconProps) {
  return (
    <Svg width={size * 1.4} height={size} viewBox="0 0 34 24" fill={fill} stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={8} r={4} />
      <Path d="M4 20a8 6 0 0 1 16 0z" />
      <Circle cx={22} cy={8} r={4} />
      <Path d="M14 20a8 6 0 0 1 16 0z" />
    </Svg>
  );
}

// Einzel (one circle).
export function SinglesIcon({ size = 20, color = '#fff', fill = 'none' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill} stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={12} r={7} />
    </Svg>
  );
}

// Doppel (two circles).
export function DoublesIcon({ size = 20, color = '#fff', fill = 'none' }: IconProps) {
  return (
    <Svg width={size * 1.4} height={size} viewBox="0 0 34 24" fill={fill} stroke={color} strokeWidth={2}>
      <Circle cx={12} cy={12} r={7} />
      <Circle cx={22} cy={12} r={7} />
    </Svg>
  );
}

// Tab bar racket + ball.
export function RacketIcon({ size = 22, color = '#141210' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <G transform="rotate(35 12 11)">
        <Ellipse cx={12} cy={6.6} rx={4.3} ry={5.7} />
        <Line x1={12} y1={3.6} x2={12} y2={9.6} strokeWidth={1} />
        <Line x1={9.3} y1={6.6} x2={14.7} y2={6.6} strokeWidth={1} />
        <Line x1={12} y1={12.3} x2={12} y2={21} />
      </G>
      <Circle cx={18.3} cy={18.3} r={2.1} fill={color} stroke="none" />
    </Svg>
  );
}

// Tab bar trophy (Rangliste).
export function TrophyIcon({ size = 22, color = '#141210' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke={color} strokeWidth={2} strokeLinecap="round" strokeLinejoin="round">
      <Path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6" />
      <Path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18" />
      <Path d="M4 22h16" />
      <Path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22" />
      <Path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22" />
      <Path d="M18 2H6v7a6 6 0 0 0 12 0V2Z" />
    </Svg>
  );
}

// Star (winner marker on score rows) — always solid dark green (PRD).
export function StarIcon({ size = 14, fill = '#0E2A21' }: IconProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" fill={fill}>
      <Path d="M12 2l2.9 6.6 7.1.6-5.4 4.7 1.6 7-6.2-3.8L5.8 21l1.6-7-5.4-4.7 7.1-.6z" />
    </Svg>
  );
}
