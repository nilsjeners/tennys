import { v } from "convex/values";
import { query, type QueryCtx } from "./_generated/server";
import { currentProfile } from "./users";
import { setsWonByTeam1, windowLast30Days } from "./lib/tennis";
import { START_RATING } from "./lib/rating";
import { buildActivityAndSets, type ActivityMatch } from "./lib/activity";

type Discipline = "singles" | "doubles";
const disciplineArg = v.optional(v.union(v.literal("singles"), v.literal("doubles")));

type MyMatch = { dateTime: number; win: boolean; setsCount: number };

// `discipline` optional — when set, only that discipline's matches count.
async function myCompletedMatches(ctx: QueryCtx, discipline?: Discipline): Promise<MyMatch[] | null> {
  const me = await currentProfile(ctx);
  if (!me) return null;
  const myId = me.profile._id;
  const matches = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect())
    .filter((m) => m.status === "completed" && (!discipline || m.type === discipline) && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)));

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

// Profile header stats (M5), per discipline (Einzel/Doppel toggle).
export const profileSummary = query({
  args: { discipline: disciplineArg },
  handler: async (ctx, args) => {
    const discipline: Discipline = args.discipline ?? "singles";
    const me = await currentProfile(ctx);
    if (!me) return null;
    const matches = await myCompletedMatches(ctx, discipline);
    if (!matches) return null;
    const total = matches.length;
    const wins = matches.filter((m) => m.win).length;
    const ordered = matches.slice().sort((a, b) => b.dateTime - a.dateTime);
    let streak = 0;
    for (const m of ordered) {
      if (m.win) streak++;
      else break;
    }
    const points = (discipline === "singles" ? me.profile.ratingSingles : me.profile.ratingDoubles) ?? START_RATING;
    const snaps = await ctx.db.query("strengthSnapshots").withIndex("by_player_discipline", (q) => q.eq("playerProfileId", me.profile._id).eq("discipline", discipline)).collect();
    // series with the match date, ordered chronologically (not by row-insertion
    // order — matches can be logged out of order) and windowed to the 30 days
    // before the most recent one
    const withDates = await Promise.all(snaps.map(async (s) => {
      const match = await ctx.db.get(s.matchId);
      return { value: s.strengthAfter, dateTime: match?.dateTime ?? s._creationTime };
    }));
    withDates.sort((a, b) => a.dateTime - b.dateTime);
    const series = windowLast30Days(withDates);
    return {
      discipline,
      matches: total,
      wins,
      losses: total - wins,
      pct: total ? Math.round((wins / total) * 100) : 0,
      streak,
      points,
      series: series.length ? series : [{ value: points, dateTime: Date.now() }],
    };
  },
});

// Calendar-week activity (Mon–Sun, last ~3 months) + set-score distribution
// for the profile's activity grid and won/lost set bar charts. Scores are
// always from "my" perspective (games I won : games the opponent won).
export const activityAndSets = query({
  args: { discipline: disciplineArg },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return null;
    const myId = me.profile._id;
    const discipline = args.discipline;
    const matches = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect()).filter(
      (m) => m.status === "completed" && (!discipline || m.type === discipline) && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId))
    );

    const activityMatches: ActivityMatch[] = [];
    for (const m of matches) {
      const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (!result) continue;
      activityMatches.push({ dateTime: m.dateTime, onTeam1: m.team1PlayerIds.includes(myId), sets: result.sets });
    }

    return buildActivityAndSets(activityMatches);
  },
});
