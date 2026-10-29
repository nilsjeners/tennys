// Shared, pure tennis helpers used by Convex functions.

export type Season = "summer" | "winter";

// Fixed global calendar rule: April–September = summer, October–March = winter.
// seasonYear is the calendar year of the match date (assumption — the data model
// leaves the winter year-boundary convention unspecified).
export function seasonForDate(ts: number): { season: Season; seasonYear: number } {
  const d = new Date(ts);
  const month = d.getMonth() + 1; // 1..12
  const season: Season = month >= 4 && month <= 9 ? "summer" : "winter";
  return { season, seasonYear: d.getFullYear() };
}

// Strength/points calculation now lives in ./rating.ts (TPRS v2 pott system).

// Winner of a singles/doubles match from its set scores (team1 perspective).
export function setsWonByTeam1(sets: { team1Games: number; team2Games: number }[]): {
  team1Sets: number;
  team2Sets: number;
} {
  let team1Sets = 0;
  let team2Sets = 0;
  for (const s of sets) {
    if (s.team1Games > s.team2Games) team1Sets++;
    else if (s.team2Games > s.team1Games) team2Sets++;
  }
  return { team1Sets, team2Sets };
}

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;

// Strength-chart series windowing: keep only points within 30 days of the
// most recent one (chronological order in, chronological order out).
export function windowLast30Days<T extends { dateTime: number }>(points: T[]): T[] {
  if (!points.length) return points;
  const cutoff = points[points.length - 1].dateTime - THIRTY_DAYS_MS;
  return points.filter((p) => p.dateTime >= cutoff);
}
