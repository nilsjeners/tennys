// Shared weekly-activity + set-score bucketing for the profile activity grid
// and won/lost set bar charts. Used both for "my" matches (creator-filtered,
// see stats.ts) and for an arbitrary player's public matches (see players.ts).

const DAY_MS = 24 * 60 * 60 * 1000;
export const ACTIVITY_WEEKS = 13; // ~3 months

export function startOfDay(ts: number): number {
  return new Date(ts).setHours(0, 0, 0, 0);
}

// Midnight of the Monday on/before `ts`.
export function startOfWeekMonday(ts: number): number {
  const d = new Date(ts);
  d.setHours(0, 0, 0, 0);
  const day = d.getDay(); // 0=Sun..6=Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  return d.getTime();
}

export type ActivityMatch = {
  dateTime: number;
  onTeam1: boolean;
  sets: { team1Games: number; team2Games: number }[];
};

export type ActivityAndSets = {
  weeks: { days: number[]; startTs: number }[];
  wonSets: Record<string, number>;
  lostSets: Record<string, number>;
  todayTs: number;
};

// Scores in wonSets/lostSets are always from the given perspective's POV
// ("my" games : opponent's games).
export function buildActivityAndSets(matches: ActivityMatch[]): ActivityAndSets {
  const now = Date.now();
  const thisWeekMonday = startOfWeekMonday(now);
  const firstWeekMonday = thisWeekMonday - (ACTIVITY_WEEKS - 1) * 7 * DAY_MS;
  const weeks = Array.from({ length: ACTIVITY_WEEKS }, (_, i) => ({
    days: new Array(7).fill(0) as number[], // Mon..Sun game counts
    startTs: firstWeekMonday + i * 7 * DAY_MS,
  }));
  const wonSets: Record<string, number> = {};
  const lostSets: Record<string, number> = {};

  for (const m of matches) {
    const dayIdx = Math.floor((m.dateTime - firstWeekMonday) / DAY_MS);
    if (dayIdx >= 0 && dayIdx < ACTIVITY_WEEKS * 7) weeks[Math.floor(dayIdx / 7)].days[dayIdx % 7]++;

    for (const s of m.sets) {
      const my = m.onTeam1 ? s.team1Games : s.team2Games;
      const opp = m.onTeam1 ? s.team2Games : s.team1Games;
      const key = `${my}:${opp}`;
      if (my > opp) wonSets[key] = (wonSets[key] ?? 0) + 1;
      else if (opp > my) lostSets[key] = (lostSets[key] ?? 0) + 1;
    }
  }

  return { weeks, wonSets, lostSets, todayTs: startOfDay(now) };
}
