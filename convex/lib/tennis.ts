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

// Standard Elo. The data model defines StrengthSnapshot.delta but not the formula,
// so we use Elo with K=32 (assumption). score: 1 = win, 0 = loss.
const K = 32;
export function eloDelta(myStrength: number, oppStrength: number, score: 0 | 1): number {
  const expected = 1 / (1 + Math.pow(10, (oppStrength - myStrength) / 400));
  return Math.round(K * (score - expected));
}

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
