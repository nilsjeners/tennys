import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { setsWonByTeam1, windowLast30Days } from "./lib/tennis";
import { START_RATING } from "./lib/rating";
import { avatarUrl } from "./lib/avatar";
import { buildActivityAndSets, type ActivityMatch } from "./lib/activity";

type Discipline = "singles" | "doubles";
const disciplineArg = v.optional(v.union(v.literal("singles"), v.literal("doubles")));
const ratingFor = (p: Doc<"playerProfiles">, d: Discipline): number =>
  (d === "singles" ? p.ratingSingles : p.ratingDoubles) ?? START_RATING;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// wins / total completed matches per profile id, filtered to one discipline.
async function tallyRecords(ctx: QueryCtx, discipline: Discipline): Promise<Map<string, { wins: number; total: number }>> {
  const rec = new Map<string, { wins: number; total: number }>();
  const bump = (id: Id<"playerProfiles">, won: boolean) => {
    const r = rec.get(id) ?? { wins: 0, total: 0 };
    r.total++;
    if (won) r.wins++;
    rec.set(id, r);
  };
  const matches = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
    .filter((m) => m.type === discipline);
  for (const m of matches) {
    const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
    if (!result) continue;
    const { team1Sets, team2Sets } = setsWonByTeam1(result.sets);
    const team1Won = team1Sets > team2Sets;
    m.team1PlayerIds.forEach((id) => bump(id, team1Won));
    m.team2PlayerIds.forEach((id) => bump(id, !team1Won));
  }
  return rec;
}

// Leaderboard for one discipline: ordered by that discipline's rating.
export const ranking = query({
  args: { discipline: disciplineArg },
  handler: async (ctx, args) => {
    const discipline: Discipline = args.discipline ?? "singles";
    const me = await currentProfile(ctx);
    const profiles = (await ctx.db.query("playerProfiles").collect()).filter((p) => !p.isDeleted);
    const rec = await tallyRecords(ctx, discipline);
    const sorted = profiles.slice().sort((a, b) => ratingFor(b, discipline) - ratingFor(a, discipline));
    return Promise.all(
      sorted.map(async (p, i) => {
        const r = rec.get(p._id) ?? { wins: 0, total: 0 };
        return {
          rank: i + 1,
          profileId: p._id,
          name: p.displayName,
          initials: initials(p.displayName),
          avatarUrl: await avatarUrl(ctx, p.avatarStorageId),
          matches: r.total,
          wins: r.wins,
          pct: r.total ? Math.round((r.wins / r.total) * 100) : 0,
          points: ratingFor(p, discipline),
          you: me?.profile._id === p._id,
        };
      })
    );
  },
});

// One player's public profile for a discipline (player-profile screen).
export const profile = query({
  args: { profileId: v.id("playerProfiles"), discipline: disciplineArg },
  handler: async (ctx, args) => {
    const discipline: Discipline = args.discipline ?? "singles";
    const p = await ctx.db.get(args.profileId);
    if (!p) return null;
    const rec = await tallyRecords(ctx, discipline);
    const r = rec.get(p._id) ?? { wins: 0, total: 0 };

    // streak: consecutive wins from most-recent completed match of this discipline backwards
    const played = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
      .filter((m) => m.type === discipline && (m.team1PlayerIds.includes(p._id) || m.team2PlayerIds.includes(p._id)))
      .sort((a, b) => b.dateTime - a.dateTime);
    let streak = 0;
    for (const m of played) {
      const res = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (!res) continue;
      const { team1Sets, team2Sets } = setsWonByTeam1(res.sets);
      const onT1 = m.team1PlayerIds.includes(p._id);
      const won = onT1 ? team1Sets > team2Sets : team2Sets > team1Sets;
      if (won) streak++;
      else break;
    }

    // rank within the discipline's rating-ordered field (deleted profiles excluded)
    const profiles = (await ctx.db.query("playerProfiles").collect()).filter((x) => !x.isDeleted);
    const sorted = profiles.slice().sort((a, b) => ratingFor(b, discipline) - ratingFor(a, discipline));
    const rank = sorted.findIndex((x) => x._id === p._id) + 1;

    // strength series, ordered chronologically (not by row-insertion order —
    // matches can be logged out of order) and windowed to the 30 days before
    // the player's most recent match
    const snaps = await ctx.db.query("strengthSnapshots").withIndex("by_player_discipline", (q) => q.eq("playerProfileId", p._id).eq("discipline", discipline)).collect();
    const withDates = await Promise.all(snaps.map(async (s) => {
      const match = await ctx.db.get(s.matchId);
      return { value: s.strengthAfter, dateTime: match?.dateTime ?? s._creationTime };
    }));
    withDates.sort((a, b) => a.dateTime - b.dateTime);
    const series = windowLast30Days(withDates);

    return {
      series: series.length ? series : [{ value: ratingFor(p, discipline), dateTime: Date.now() }],
      profileId: p._id,
      name: p.displayName,
      initials: initials(p.displayName),
      avatarUrl: await avatarUrl(ctx, p.avatarStorageId),
      discipline,
      points: ratingFor(p, discipline),
      ratingSingles: ratingFor(p, "singles"),
      ratingDoubles: ratingFor(p, "doubles"),
      matches: r.total,
      wins: r.wins,
      pct: r.total ? Math.round((r.wins / r.total) * 100) : 0,
      streak,
      rank,
      rankTotal: sorted.length,
    };
  },
});

// Weekly activity + set-score distribution for a player's public profile —
// same shape as stats.activityAndSets, but over ALL completed matches
// involving them (not creator-filtered, since we're not the match owner).
export const activityAndSets = query({
  args: { profileId: v.id("playerProfiles"), discipline: disciplineArg },
  handler: async (ctx, args) => {
    const discipline: Discipline = args.discipline ?? "singles";
    const pid = args.profileId;
    const matches = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
      .filter((m) => m.type === discipline && (m.team1PlayerIds.includes(pid) || m.team2PlayerIds.includes(pid)));

    const activityMatches: ActivityMatch[] = [];
    for (const m of matches) {
      const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (!result) continue;
      activityMatches.push({ dateTime: m.dateTime, onTeam1: m.team1PlayerIds.includes(pid), sets: result.sets });
    }

    return buildActivityAndSets(activityMatches);
  },
});

// Other players to discover / challenge.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    const profiles = await ctx.db.query("playerProfiles").collect();
    return Promise.all(
      profiles
        .filter((p) => p._id !== me?.profile._id && !p.isDeleted)
        .map(async (p) => ({
          profileId: p._id,
          name: p.displayName,
          initials: initials(p.displayName),
          avatarUrl: await avatarUrl(ctx, p.avatarStorageId),
          skillLevel: p.skillLevel ?? null,
          points: ratingFor(p, "singles"),
          ratingDoubles: ratingFor(p, "doubles"),
          city: p.city ?? null,
        }))
    );
  },
});

// Send a connection (challenge) request to another profile.
export const challenge = mutation({
  args: { profileId: v.id("playerProfiles") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    if (me.profile._id === args.profileId) throw new Error("Du kannst dich nicht selbst herausfordern.");

    const existing = (await ctx.db
      .query("connections")
      .withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", me.profile._id))
      .collect()).find((c) => c.recipientPlayerProfileId === args.profileId);
    if (existing) return existing._id;

    return ctx.db.insert("connections", {
      requesterPlayerProfileId: me.profile._id,
      recipientPlayerProfileId: args.profileId,
      status: "pending",
    });
  },
});
