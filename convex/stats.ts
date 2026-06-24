import { query, type QueryCtx } from "./_generated/server";
import { currentProfile } from "./users";
import { seasonForDate, setsWonByTeam1 } from "./lib/tennis";

type MyMatch = { dateTime: number; win: boolean; setsCount: number };

async function myCompletedMatches(ctx: QueryCtx): Promise<MyMatch[] | null> {
  const me = await currentProfile(ctx);
  if (!me) return null;
  const myId = me.profile._id;
  const matches = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect())
    .filter((m) => m.status === "completed" && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)));

  const out: MyMatch[] = [];
  for (const m of matches) {
    const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
    if (!result) continue;
    const onTeam1 = m.team1PlayerIds.includes(myId);
    const { team1Sets, team2Sets } = setsWonByTeam1(result.sets);
    const win = onTeam1 ? team1Sets > team2Sets : team2Sets > team1Sets;
    out.push({ dateTime: m.dateTime, win, setsCount: result.sets.length });
  }
  return out;
}

// Profile header stats (M5).
export const profileSummary = query({
  args: {},
  handler: async (ctx) => {
    const matches = await myCompletedMatches(ctx);
    if (!matches) return null;
    const total = matches.length;
    const wins = matches.filter((m) => m.win).length;
    const ordered = matches.slice().sort((a, b) => b.dateTime - a.dateTime);
    let streak = 0;
    for (const m of ordered) {
      if (m.win) streak++;
      else break;
    }
    return { matches: total, wins, pct: total ? Math.round((wins / total) * 100) : 0, streak };
  },
});

// Season statistics (M6). aces / first-serve % are intentionally absent —
// no data source or input flow exists for them yet.
export const seasonStats = query({
  args: {},
  handler: async (ctx) => {
    const matches = await myCompletedMatches(ctx);
    if (!matches) return null;
    const total = matches.length;
    const wins = matches.filter((m) => m.win).length;
    const losses = total - wins;
    const totalSets = matches.reduce((n, m) => n + m.setsCount, 0);

    // First 6 calendar months of the current year (matches the J–J chart).
    const year = new Date().getFullYear();
    const months = Array.from({ length: 6 }, (_, i) => ({
      label: ["J", "F", "M", "A", "M", "J"][i],
      wins: 0,
      losses: 0,
    }));
    for (const m of matches) {
      const d = new Date(m.dateTime);
      if (d.getFullYear() === year && d.getMonth() < 6) {
        if (m.win) months[d.getMonth()].wins++;
        else months[d.getMonth()].losses++;
      }
    }

    return {
      season: seasonForDate(Date.now()).season,
      seasonYear: year,
      winPct: total ? Math.round((wins / total) * 100) : 0,
      wins,
      losses,
      total,
      avgSets: total ? Math.round((totalSets / total) * 10) / 10 : 0,
      months,
    };
  },
});
