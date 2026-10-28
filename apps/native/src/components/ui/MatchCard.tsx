import { Pressable, Text, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { Avatar, AvatarStack } from '@/components/ui/Avatar';
import { ScoreCells } from '@/components/ui/ScoreCells';
import { colors, fonts } from '@/theme/tokens';

export type CardPlayer = { initials: string; bg: string; fg: string; uri?: string | null };
export type CardSide = { players: CardPlayer[]; name: string; scores: number[]; won: boolean };
export type MatchCardData = {
  sideA: CardSide;
  sideB: CardSide;
  likes: number;
  comments: number;
  dateLabel: string;
};

function SideRow({ side, oppScores }: { side: CardSide; oppScores: number[] }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9, flex: 1, minWidth: 0 }}>
        {side.players.length > 1 ? (
          <AvatarStack a={side.players[0]} b={side.players[1]} size={38} />
        ) : (
          <Avatar {...side.players[0]} size={38} />
        )}
        <Text numberOfLines={1} style={{ fontFamily: fonts.sans, fontSize: 14, color: '#1A1815', flexShrink: 1 }}>
          {side.name}
        </Text>
      </View>
      <ScoreCells own={side.scores} opp={oppScores} winner={side.won} />
    </View>
  );
}

// Like (racket) glyph — outline at 0, solid dark green when count > 0 (PRD).
function RacketMini({ active }: { active: boolean }) {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill={active ? colors.courtGreen : 'none'}
      stroke={active ? colors.courtGreen : colors.inkSecondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M7 10v12" />
      <Path d="M15 5.88 14 10h5.83a2 2 0 0 1 1.92 2.56l-2.33 8A2 2 0 0 1 17.5 22H4a2 2 0 0 1-2-2v-8a2 2 0 0 1 2-2h2.76a2 2 0 0 0 1.79-1.11L12 2a3.13 3.13 0 0 1 3 3.88Z" />
    </Svg>
  );
}

function CommentMini({ active }: { active: boolean }) {
  return (
    <Svg
      width={15}
      height={15}
      viewBox="0 0 24 24"
      fill={active ? colors.courtGreen : 'none'}
      stroke={active ? colors.courtGreen : colors.inkSecondary}
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round">
      <Path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z" />
    </Svg>
  );
}

// The two-row score card used on Spiele + Profile. Tap → match detail.
export function MatchCard({ data, onPress }: { data: MatchCardData; onPress?: () => void }) {
  const hasLikes = data.likes > 0;
  const hasComments = data.comments > 0;
  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => ({
        backgroundColor: '#fff',
        paddingHorizontal: 16,
        paddingVertical: 14,
        opacity: pressed ? 0.9 : 1,
        shadowColor: '#000',
        shadowOpacity: 0.07,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 1 },
        elevation: 2,
      })}>
      <View style={{ marginBottom: 10 }}>
        <SideRow side={data.sideA} oppScores={data.sideB.scores} />
      </View>
      <SideRow side={data.sideB} oppScores={data.sideA.scores} />
      <View style={{ height: 1, backgroundColor: colors.border, marginTop: 12, marginBottom: 9 }} />
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <RacketMini active={hasLikes} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: hasLikes ? colors.courtGreen : colors.inkSecondary }}>
              {data.likes}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
            <CommentMini active={hasComments} />
            <Text style={{ fontFamily: fonts.sansBold, fontSize: 12, color: hasComments ? colors.courtGreen : colors.inkSecondary }}>
              {data.comments}
            </Text>
          </View>
        </View>
        <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{data.dateLabel}</Text>
      </View>
    </Pressable>
  );
}
