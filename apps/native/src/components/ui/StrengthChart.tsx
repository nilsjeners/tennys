import { useState } from 'react';
import { Text, View, type LayoutChangeEvent } from 'react-native';
import Svg, { Circle, Defs, Line, LinearGradient, Polyline, Stop } from 'react-native-svg';
import { colors, fonts, radii } from '@/theme/tokens';
import { matchDateLabel } from '@/lib/format';
import { useI18n } from '@/lib/i18n';

export type ChartPoint = { value: number; dateTime?: number; matchId?: string };
export type Series = { color: string; points: ChartPoint[]; area?: boolean };

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Line/area chart of strength history. Fills its container width; one or more
// series. With `interactive`, touching/dragging the chart scrubs the FIRST
// series and shows a tooltip with exact points + date (PRD).
export function StrengthChart({
  series,
  height = 96,
  showDot = true,
  interactive = false,
  highlightMatchId,
}: {
  series: Series[];
  height?: number;
  showDot?: boolean;
  interactive?: boolean;
  // marks the point of a specific match on the line — the viewed match isn't
  // always the most recent one, so `showDot`'s end-of-line dot alone doesn't place it
  highlightMatchId?: string;
}) {
  const { t, locale } = useI18n();
  const [w, setW] = useState(0);
  const [scrub, setScrub] = useState<number | null>(null);
  const onLayout = (e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width);

  // A lone data point can't draw a line — duplicate it so it still spans the
  // full width as a flat line, with the (only) match anchored on the right.
  // (Positioned by index, not date — a single point has nothing to date-scale against.)
  const singled = series.map((s) =>
    s.points.length === 1 ? { ...s, wasSingle: true, points: [s.points[0], s.points[0]] } : { ...s, wasSingle: false }
  );

  // x-axis is date-based: the most recent point across all series sits at
  // the right edge, and the window spans the 30 days before it.
  const dates = singled.filter((s) => !s.wasSingle).flatMap((s) => s.points.map((p) => p.dateTime).filter((d): d is number => d != null));
  const maxDate = dates.length ? Math.max(...dates) : null;
  const minDate = maxDate !== null ? maxDate - THIRTY_DAYS_MS : null;

  // The line must always reach the left edge: if a series' earliest match is
  // more recent than the window start, hold its value flat back to minDate
  // (nothing happened before it, so there's nothing else to show there).
  const normalizedSeries = singled.map((s) => {
    if (s.wasSingle || minDate === null) return s;
    const first = s.points[0];
    if (first.dateTime != null && first.dateTime > minDate) {
      return { ...s, points: [{ value: first.value, dateTime: minDate }, ...s.points] };
    }
    return s;
  });

  const all = normalizedSeries.flatMap((s) => s.points.map((p) => p.value));
  const lo = all.length ? Math.min(...all) : 0;
  const hi = all.length ? Math.max(...all) : 1;
  const span = hi - lo || 1;
  const padY = 10;
  const x0 = 4;
  const x1 = Math.max(w - 4, x0 + 1);
  const y0 = padY;
  const y1 = height - padY;

  const xAt = (s: (typeof normalizedSeries)[number], i: number, n: number) => {
    const p = s.points[i];
    if (!s.wasSingle && maxDate !== null && minDate !== null && p.dateTime != null) {
      const clamped = Math.max(minDate, p.dateTime);
      return x0 + ((clamped - minDate) / (maxDate - minDate)) * (x1 - x0);
    }
    return n <= 1 ? x0 : x0 + (i * (x1 - x0)) / (n - 1);
  };
  const yAt = (v: number) => y1 - ((v - lo) / span) * (y1 - y0);

  const main = normalizedSeries[0];
  const n = main?.points.length ?? 0;
  const mainXs = main ? main.points.map((_, i) => xAt(main, i, n)) : [];
  const scrubAt = (x: number) => {
    if (!interactive || n < 2) return;
    let bestIdx = 0;
    let bestDist = Infinity;
    for (let i = 0; i < mainXs.length; i++) {
      const d = Math.abs(mainXs[i] - x);
      if (d < bestDist) {
        bestDist = d;
        bestIdx = i;
      }
    }
    setScrub(bestIdx);
  };
  const scrubPoint = scrub !== null && main ? main.points[scrub] : null;
  const scrubX = scrub !== null ? mainXs[scrub] : 0;

  // keep the tooltip inside the chart bounds
  const tooltipLeft = Math.max(4, Math.min(w - 110, scrubX - 52));

  return (
    <View
      onLayout={onLayout}
      style={{ width: '100%', height }}
      onStartShouldSetResponder={() => interactive}
      onMoveShouldSetResponder={() => interactive}
      onResponderGrant={(e) => scrubAt(e.nativeEvent.locationX)}
      onResponderMove={(e) => scrubAt(e.nativeEvent.locationX)}
      onResponderRelease={() => setScrub(null)}
      onResponderTerminate={() => setScrub(null)}>
      {w > 0 ? (
        <Svg width={w} height={height}>
          <Defs>
            {normalizedSeries.map((s, si) => (
              <LinearGradient key={`g${si}`} id={`tpStrength${si}`} x1="0" y1="0" x2="0" y2="1">
                <Stop offset="0" stopColor={s.color} stopOpacity={0.35} />
                <Stop offset="1" stopColor={s.color} stopOpacity={0} />
              </LinearGradient>
            ))}
          </Defs>
          {/* area fills first (under lines) */}
          {normalizedSeries.map((s, si) =>
            s.area && s.points.length ? (
              <Polyline
                key={`a${si}`}
                points={`${xAt(s, 0, s.points.length)},${y1} ${s.points.map((p, i) => `${xAt(s, i, s.points.length)},${yAt(p.value)}`).join(' ')} ${xAt(s, s.points.length - 1, s.points.length)},${y1}`}
                fill={`url(#tpStrength${si})`}
                stroke="none"
              />
            ) : null
          )}
          {normalizedSeries.map((s, si) =>
            s.points.length ? (
              <Polyline
                key={`l${si}`}
                points={s.points.map((p, i) => `${xAt(s, i, s.points.length)},${yAt(p.value)}`).join(' ')}
                fill="none"
                stroke={s.color}
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            ) : null
          )}
          {showDot &&
            normalizedSeries.map((s, si) =>
              s.points.length ? (
                <Circle
                  key={`d${si}`}
                  cx={xAt(s, s.points.length - 1, s.points.length)}
                  cy={yAt(s.points[s.points.length - 1].value)}
                  r={3.5}
                  fill={s.color}
                  stroke="#fff"
                  strokeWidth={1.5}
                />
              ) : null
            )}
          {highlightMatchId &&
            normalizedSeries.map((s, si) => {
              const i = s.points.findIndex((p) => p.matchId === highlightMatchId);
              // already marked by the end-of-line dot — no second circle needed
              if (i === -1 || (showDot && i === s.points.length - 1)) return null;
              return (
                <Circle
                  key={`h${si}`}
                  cx={xAt(s, i, s.points.length)}
                  cy={yAt(s.points[i].value)}
                  r={3.5}
                  fill="#fff"
                  stroke={s.color}
                  strokeWidth={2}
                />
              );
            })}
          {scrubPoint ? (
            <>
              <Line x1={scrubX} y1={y0} x2={scrubX} y2={y1} stroke={colors.borderStrong} strokeWidth={1} strokeDasharray="3 3" />
              <Circle cx={scrubX} cy={yAt(scrubPoint.value)} r={5} fill={main!.color} stroke="#fff" strokeWidth={2} />
            </>
          ) : null}
        </Svg>
      ) : null}
      {scrubPoint ? (
        <View
          pointerEvents="none"
          style={{
            position: 'absolute',
            top: -6,
            left: tooltipLeft,
            flexDirection: 'row',
            alignItems: 'baseline',
            gap: 6,
            backgroundColor: colors.courtGreen,
            borderRadius: radii.sm,
            paddingHorizontal: 9,
            paddingVertical: 5,
          }}>
          <Text style={{ fontFamily: fonts.display, fontSize: 15, color: colors.lime }}>{Math.round(scrubPoint.value)}</Text>
          {scrubPoint.dateTime ? (
            <Text style={{ fontFamily: fonts.sans, fontSize: 10, color: 'rgba(255,255,255,0.7)' }}>{matchDateLabel(scrubPoint.dateTime, t, locale)}</Text>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
