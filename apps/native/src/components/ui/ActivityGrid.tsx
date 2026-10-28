import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import { colors, fonts } from '@/theme/tokens';

// 0 games = Sky Subtle, 1 = Sky Light, 2 = Sky, 3+ = Sky Dark.
function levelColor(n: number): string {
  if (n <= 0) return colors.skySubtle;
  if (n === 1) return colors.skyLight;
  if (n === 2) return colors.sky;
  return colors.skyDark;
}

export type ActivityWeek = { days: number[]; startTs: number };

const GAP = 4;
const DAY_MS = 24 * 60 * 60 * 1000;
const LABEL_W = 84; // fits the longest German weekday name ("Donnerstag")

// Rows = weekday (Monday → Sunday, full names, flush left under the card
// title), columns = weeks (a month's full name appears left-aligned in the
// week its first day falls in). Day boxes fill the full measured width
// exactly. Today is a rounded square marked with a white diagonal cross;
// days after today (the in-progress current week) are greyed out.
export function ActivityGrid({ weeks, locale, todayTs }: { weeks: ActivityWeek[]; locale: string; todayTs: number }) {
  const [width, setWidth] = useState(0);
  const onLayout = (e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width);

  const n = weeks.length;
  const box = n > 0 ? Math.max(10, (width - LABEL_W - (n - 1) * GAP) / n) : 0;

  const monthFmt = new Intl.DateTimeFormat(locale, { month: 'long' });
  const weekdayFmt = new Intl.DateTimeFormat(locale, { weekday: 'long' });
  const weekdayNames = weeks[0] ? Array.from({ length: 7 }, (_, row) => weekdayFmt.format(weeks[0].startTs + row * DAY_MS)) : [];

  let lastMonth = -1;

  // Kept as a single persistent root with onLayout (matches StrengthChart's
  // pattern) — conditionally swapping the whole returned element between
  // renders breaks react-native-web's layout measurement.
  return (
    <View onLayout={onLayout} style={{ width: '100%' }}>
      {width > 0 ? (
        <>
          <View style={{ flexDirection: 'row', marginBottom: 6 }}>
            <View style={{ width: LABEL_W + GAP }} />
            <View style={{ flexDirection: 'row', gap: GAP }}>
              {weeks.map((w, i) => {
                const month = new Date(w.startTs).getMonth();
                const showLabel = month !== lastMonth;
                lastMonth = month;
                return (
                  <Text key={i} numberOfLines={1} style={{ width: box, overflow: 'visible', fontFamily: fonts.sans, fontSize: 10, color: colors.inkMuted }}>
                    {showLabel ? monthFmt.format(w.startTs) : ''}
                  </Text>
                );
              })}
            </View>
          </View>
          {weekdayNames.map((name, row) => (
            <View key={row} style={{ flexDirection: 'row', alignItems: 'center', marginBottom: GAP }}>
              <Text style={{ width: LABEL_W, fontFamily: fonts.sans, fontSize: 11, color: colors.inkSecondary }} numberOfLines={1}>
                {name}
              </Text>
              <View style={{ flexDirection: 'row', gap: GAP, marginLeft: GAP }}>
                {weeks.map((w, col) => {
                  const cellTs = w.startTs + row * DAY_MS;
                  const count = w.days[row];
                  const isToday = cellTs === todayTs;
                  const isFuture = cellTs > todayTs;
                  return (
                    <View
                      key={col}
                      style={{
                        width: box,
                        height: box,
                        borderRadius: 3,
                        backgroundColor: isFuture ? colors.border : levelColor(count),
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}>
                      {isToday ? <Text style={{ fontSize: box * 0.6, lineHeight: box * 0.7, fontFamily: fonts.sansBold, color: '#fff' }}>✕</Text> : null}
                    </View>
                  );
                })}
              </View>
            </View>
          ))}
        </>
      ) : null}
    </View>
  );
}
