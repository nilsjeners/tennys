import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { ScoreText } from '@/components/ui/ScoreText';
import { StarIcon } from '@/components/ui/icons';

// Set scores for one side of a match row (PRD "Satz-Scores in Listen"):
// each WON set renders dark/full-contrast, each lost set muted — so results can
// be scanned per set, not per side. The match winner gets a solid dark-green star.
export function ScoreCells({
  own,
  opp,
  winner,
  size = 23,
  star = true,
}: {
  /** this side's games per set */
  own: number[];
  /** the opposing side's games per set (for per-set win coloring) */
  opp: number[];
  /** this side won the match → show the solid star */
  winner: boolean;
  size?: number;
  star?: boolean;
}) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
      {winner && star ? <StarIcon size={14} /> : null}
      {own.map((s, i) => (
        <ScoreText key={i} size={size} color={s > (opp[i] ?? 0) ? colors.ink : colors.inkMuted}>
          {s}
        </ScoreText>
      ))}
    </View>
  );
}
