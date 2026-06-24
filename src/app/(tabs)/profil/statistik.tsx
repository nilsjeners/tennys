import { useRouter } from 'expo-router';
import { useQuery } from 'convex/react';
import { ScrollView, Text, View } from 'react-native';

import { api } from '@convex/_generated/api';
import { Card } from '@/components/ui/Card';
import { DarkHeader, HeaderIconButton } from '@/components/ui/DarkHeader';
import { colors, fonts, radii } from '@/theme/tokens';

const BAR_MAX = 60;

export default function Statistik() {
  const router = useRouter();
  const s = useQuery(api.stats.seasonStats, {});

  const kpis = [
    { label: 'Siegquote', value: `${s?.winPct ?? 0}%`, sub: `${s?.wins ?? 0} von ${s?.total ?? 0} Matches`, dark: true },
    { label: '1. Aufschlag', value: '–', sub: 'noch nicht erfasst', dark: false },
    { label: 'Asse', value: '–', sub: 'noch nicht erfasst', dark: false },
    { label: 'Ø Sätze', value: String(s?.avgSets ?? 0).replace('.', ','), sub: 'pro Match', dark: true },
  ];

  const months = s?.months ?? [];
  const maxTotal = Math.max(1, ...months.map((m) => m.wins + m.losses));

  return (
    <View style={{ flex: 1, backgroundColor: colors.screen }}>
      <DarkHeader>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
          <HeaderIconButton name="arrow-left" onPress={() => router.back()} />
          <View>
            <Text style={{ fontFamily: fonts.display, fontSize: 24, color: '#fff', lineHeight: 24 }}>Statistik</Text>
            <Text style={{ fontFamily: fonts.sans, fontSize: 12, color: 'rgba(255,255,255,0.5)', marginTop: 1 }}>Saison {s?.seasonYear ?? ''}</Text>
          </View>
        </View>
      </DarkHeader>

      <ScrollView contentContainerStyle={{ padding: 16 }} showsVerticalScrollIndicator={false}>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 14 }}>
          {kpis.map((k) => (
            <View key={k.label} style={{ width: '47.8%', flexGrow: 1, backgroundColor: k.dark ? colors.courtGreen : colors.courtGreenLight, borderRadius: radii.lg, padding: 14 }}>
              <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 10, letterSpacing: 0.6, textTransform: 'uppercase', color: 'rgba(255,255,255,0.45)', marginBottom: 4 }}>{k.label}</Text>
              <Text style={{ fontFamily: fonts.display, fontSize: 34, color: colors.lime, lineHeight: 34 }}>{k.value}</Text>
              <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: 'rgba(255,255,255,0.4)', marginTop: 3 }}>{k.sub}</Text>
            </View>
          ))}
        </View>

        <Card style={{ padding: 16, marginBottom: 14 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 14 }}>Matches pro Monat</Text>
          <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 8, height: 76 }}>
            {months.map((mo, i) => {
              const total = mo.wins + mo.losses;
              const empty = total === 0;
              const limeH = (mo.wins / maxTotal) * BAR_MAX;
              const redH = (mo.losses / maxTotal) * BAR_MAX;
              return (
                <View key={i} style={{ flex: 1, alignItems: 'center', gap: 4 }}>
                  <View style={{ width: '100%', height: 64, justifyContent: 'flex-end' }}>
                    {empty ? (
                      <View style={{ height: 4, borderRadius: 4, backgroundColor: colors.border }} />
                    ) : (
                      <>
                        {redH > 0 && <View style={{ height: redH, borderTopLeftRadius: 4, borderTopRightRadius: 4, backgroundColor: colors.red }} />}
                        {limeH > 0 && <View style={{ height: limeH, backgroundColor: colors.lime, borderTopLeftRadius: redH > 0 ? 0 : 4, borderTopRightRadius: redH > 0 ? 0 : 4 }} />}
                      </>
                    )}
                  </View>
                  <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: colors.inkMuted }}>{mo.label}</Text>
                </View>
              );
            })}
          </View>
          <View style={{ flexDirection: 'row', gap: 14, marginTop: 12 }}>
            <Legend color={colors.lime} label="Siege" />
            <Legend color={colors.red} label="Niederlagen" />
          </View>
        </Card>

        <Card style={{ padding: 16 }}>
          <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 13, color: colors.ink, marginBottom: 10 }}>Bilanz</Text>
          <View style={{ flexDirection: 'row', borderRadius: radii.pill, overflow: 'hidden', height: 12, marginBottom: 8, backgroundColor: colors.border }}>
            <View style={{ flex: Math.max(0, s?.wins ?? 0), backgroundColor: colors.limeDark }} />
            <View style={{ flex: Math.max(0, s?.losses ?? 0), backgroundColor: colors.red }} />
          </View>
          <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.limeText }}>{s?.wins ?? 0} Siege</Text>
            <Text style={{ fontFamily: fonts.sansSemiBold, fontSize: 12, color: colors.redDark }}>{s?.losses ?? 0} Niederlagen</Text>
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function Legend({ color, label }: { color: string; label: string }) {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 5 }}>
      <View style={{ width: 10, height: 10, borderRadius: 2, backgroundColor: color }} />
      <Text style={{ fontFamily: fonts.sans, fontSize: 11, color: colors.inkMuted }}>{label}</Text>
    </View>
  );
}
