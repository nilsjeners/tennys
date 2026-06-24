import { Feather } from '@expo/vector-icons';
import { useQuery } from 'convex/react';
import { ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Avatar } from '@/components/ui/Avatar';
import { StatusTag } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { DarkHeader } from '@/components/ui/DarkHeader';
import { MatchHistoryRow } from '@/components/ui/MatchHistoryRow';
import { SectionLabel } from '@/components/ui/SectionLabel';
import { avatarColors, hourLabel, matchDateLabel, scoreLine } from '@/lib/format';
import { colors, fonts, radii } from '@/theme/tokens';

export default function Matches() {
  const home = useQuery(api.matches.home, {});
  const summary = useQuery(api.stats.profileSummary, {});
  const streak = summary?.streak ?? 0;

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader paddingBottom={18}>
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 24, color: colors.lime }}>tennys</Text>
          <View style={{ flexDirection: 'row', gap: 16, alignItems: 'center' }}>
            <Feather name="search" size={22} color="rgba(255,255,255,0.6)" />
            <View>
              <Feather name="bell" size={22} color="rgba(255,255,255,0.6)" />
              <View style={{ position: 'absolute', top: 0, right: 0, width: 8, height: 8, borderRadius: 4, backgroundColor: colors.lime, borderWidth: 2, borderColor: colors.courtGreen }} />
            </View>
          </View>
        </View>
        {streak > 0 && (
          <View style={{ alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 7, backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: radii.pill, paddingHorizontal: 14, paddingVertical: 6 }}>
            <Text style={{ fontSize: 14 }}>🎾</Text>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: '#fff' }}>{streak} Siege in Folge</Text>
          </View>
        )}
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 24 }} showsVerticalScrollIndicator={false}>
        {home?.next && (
          <>
            <SectionLabel style={{ marginLeft: 4 }}>Dein nächstes Match</SectionLabel>
            <Card style={{ flexDirection: 'row', alignItems: 'center', gap: 12, marginBottom: 16 }}>
              <View style={{ width: 44, height: 44, borderRadius: 12, backgroundColor: colors.blueWash, alignItems: 'center', justifyContent: 'center' }}>
                <Text style={{ fontFamily: fonts.display, fontSize: 18, color: colors.blue, lineHeight: 18 }}>{hourLabel(home.next.scheduledFor)}</Text>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 9, color: colors.blue }}>UHR</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: colors.ink }}>{matchDateLabel(home.next.scheduledFor)} · vs {home.next.opponentName}</Text>
                <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: colors.inkSecondary, marginTop: 1 }}>{home.next.place}</Text>
              </View>
              <StatusTag label="GEPLANT" />
            </Card>
          </>
        )}

        {home?.live && (
          <>
            <SectionLabel style={{ marginLeft: 4 }}>Live</SectionLabel>
            <View style={{ backgroundColor: colors.courtGreen, borderRadius: radii.lg, padding: 15, marginBottom: 16 }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                  <View style={{ width: 7, height: 7, borderRadius: 3.5, backgroundColor: colors.red }} />
                  <Text style={{ fontFamily: fonts.sansBold, fontSize: 10, color: colors.red, letterSpacing: 0.6 }}>LIVE</Text>
                </View>
                <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)' }}>Satz {home.live.currentSet}</Text>
              </View>
              <LiveRow initials={home.live.me.initials} bg={colors.lime} fg={colors.courtGreen} name={home.live.me.name} nameColor="#fff" scores={home.live.me.scores} scoreColor={colors.lime} />
              <View style={{ height: 8 }} />
              <LiveRow initials={home.live.opponent.initials} bg={colors.red} fg="#fff" name={home.live.opponent.name} nameColor="rgba(255,255,255,0.7)" scores={home.live.opponent.scores} scoreColor="rgba(255,255,255,0.5)" />
            </View>
          </>
        )}

        <SectionLabel style={{ marginLeft: 4 }}>Letzte Matches</SectionLabel>
        <Card flush>
          {home?.recent.length ? (
            home.recent.map((m, i) => {
              const c = m.opponentId ? avatarColors(m.opponentId) : { bg: colors.courtGreen, fg: colors.lime };
              return (
                <MatchHistoryRow
                  key={m.matchId}
                  entry={{ initials: m.opponentInitials, bg: c.bg, fg: c.fg, name: `vs ${m.opponentName}`, sub: matchDateLabel(m.dateTime), score: scoreLine(m.sets), win: m.win }}
                  last={i === home.recent.length - 1}
                />
              );
            })
          ) : (
            <Text style={{ fontFamily: fonts.sans, fontSize: 13, color: colors.inkMuted, padding: 16 }}>Noch keine Matches erfasst.</Text>
          )}
        </Card>
      </ScrollView>
    </View>
  );
}

function LiveRow({ initials, bg, fg, name, nameColor, scores, scoreColor }: { initials: string; bg: string; fg: string; name: string; nameColor: string; scores: number[]; scoreColor: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 9 }}>
        <Avatar initials={initials} size={28} bg={bg} fg={fg} />
        <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 14, color: nameColor }}>{name}</Text>
      </View>
      <View style={{ flexDirection: 'row', gap: 6 }}>
        {scores.map((s, i) => (
          <Text key={i} style={{ fontFamily: fonts.monoSemiBold, fontSize: 15, color: scoreColor }}>{s}</Text>
        ))}
      </View>
    </View>
  );
}
