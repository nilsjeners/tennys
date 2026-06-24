import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { eloDelta, seasonForDate, setsWonByTeam1 } from "./lib/tennis";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function opponentOf(ctx: QueryCtx | MutationCtx, match: Doc<"matches">, myId: Id<"playerProfiles">) {
  const onTeam1 = match.team1PlayerIds.some((id) => id === myId);
  const oppIds = onTeam1 ? match.team2PlayerIds : match.team1PlayerIds;
  const opp = oppIds[0] ? await ctx.db.get(oppIds[0]) : null;
  return { onTeam1, opp };
}

// One completed match summarised from the current profile's perspective.
async function summarize(ctx: QueryCtx | MutationCtx, match: Doc<"matches">, myId: Id<"playerProfiles">) {
  const { onTeam1, opp } = await opponentOf(ctx, match, myId);
  const result = await ctx.db
    .query("matchResults")
    .withIndex("by_match", (q) => q.eq("matchId", match._id))
    .unique();
  const rawSets = result?.sets ?? [];
  const sets = rawSets.map((s) => ({
    mine: onTeam1 ? s.team1Games : s.team2Games,
    theirs: onTeam1 ? s.team2Games : s.team1Games,
  }));
  const { team1Sets, team2Sets } = setsWonByTeam1(rawSets);
  const win = onTeam1 ? team1Sets > team2Sets : team2Sets > team1Sets;
  return {
    matchId: match._id,
    dateTime: match.dateTime,
    opponentName: opp?.displayName ?? "Unbekannt",
    opponentInitials: opp ? initials(opp.displayName) : "?",
    opponentId: opp?._id ?? null,
    sets,
    win,
  };
}

// Home screen feed: next scheduled, live, recent completed.
export const home = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return null;
    const myId = me.profile._id;

    const mine = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect()).filter(
      (m) => m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)
    );

    const completed = mine
      .filter((m) => m.status === "completed")
      .sort((a, b) => b.dateTime - a.dateTime);
    const recent = await Promise.all(completed.slice(0, 5).map((m) => summarize(ctx, m, myId)));

    const scheduled = mine
      .filter((m) => m.status === "scheduled")
      .sort((a, b) => (a.scheduledFor ?? a.dateTime) - (b.scheduledFor ?? b.dateTime));
    let next = null;
    if (scheduled[0]) {
      const { opp } = await opponentOf(ctx, scheduled[0], myId);
      next = {
        scheduledFor: scheduled[0].scheduledFor ?? scheduled[0].dateTime,
        place: scheduled[0].place,
        opponentName: opp?.displayName ?? "Unbekannt",
      };
    }

    const liveMatch = mine.find((m) => m.status === "live");
    let live = null;
    if (liveMatch) {
      const s = await summarize(ctx, liveMatch, myId);
      live = {
        currentSet: Math.max(1, s.sets.length),
        me: { name: "Du", initials: "DU", scores: s.sets.map((x) => x.mine) },
        opponent: { name: s.opponentName, initials: s.opponentInitials, scores: s.sets.map((x) => x.theirs) },
      };
    }

    return { next, live, recent };
  },
});

// Longer completed history (profile screen).
export const history = query({
  args: { limit: v.optional(v.number()) },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const myId = me.profile._id;
    const mine = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect())
      .filter((m) => m.status === "completed" && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)))
      .sort((a, b) => b.dateTime - a.dateTime)
      .slice(0, args.limit ?? 10);
    return Promise.all(mine.map((m) => summarize(ctx, m, myId)));
  },
});

// Log a completed singles match: result + Elo strength snapshots for both players.
// Implements the locked rules around StrengthSnapshot + denormalised season.
export const create = mutation({
  args: {
    opponentProfileId: v.id("playerProfiles"),
    sets: v.array(v.object({ myGames: v.number(), theirGames: v.number() })),
    place: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Kein Profil — bitte zuerst anmelden.");
    if (args.sets.length === 0) throw new Error("Mindestens ein Satz erforderlich.");

    const opp = await ctx.db.get(args.opponentProfileId);
    if (!opp) throw new Error("Gegner nicht gefunden.");

    return logCompletedMatch(ctx, {
      myProfile: me.profile,
      opponent: opp,
      createdByUserId: me.user._id,
      sets: args.sets.map((s) => ({ team1Games: s.myGames, team2Games: s.theirGames })),
      dateTime: Date.now(),
      place: args.place ?? "",
    });
  },
});

// Shared logger for a completed singles match — result + Elo snapshots for both
// players. Used by the create mutation and the seed. Keeps the locked rules in
// one place. (team1 = myProfile, team2 = opponent.)
export async function logCompletedMatch(
  ctx: MutationCtx,
  args: {
    myProfile: Doc<"playerProfiles">;
    opponent: Doc<"playerProfiles">;
    createdByUserId: Id<"users">;
    sets: { team1Games: number; team2Games: number }[];
    dateTime: number;
    place?: string;
  }
): Promise<Id<"matches">> {
  const { myProfile, opponent, sets, dateTime } = args;
  if (sets.length === 0) throw new Error("Mindestens ein Satz erforderlich.");
  const { season, seasonYear } = seasonForDate(dateTime);
  const { team1Sets, team2Sets } = setsWonByTeam1(sets);
  const iWon = team1Sets > team2Sets;

  const matchId = await ctx.db.insert("matches", {
    type: "singles",
    status: "completed",
    dateTime,
    place: args.place ?? "",
    clubId: myProfile.clubId,
    season,
    seasonYear,
    team1PlayerIds: [myProfile._id],
    team2PlayerIds: [opponent._id],
    createdByUserId: args.createdByUserId,
  });

  await ctx.db.insert("matchResults", {
    matchId,
    sets,
    isRetirement: false,
    isWalkover: false,
    team1TotalGames: sets.reduce((n, s) => n + s.team1Games, 0),
    team2TotalGames: sets.reduce((n, s) => n + s.team2Games, 0),
  });

  // Re-read profiles so chained seed matches see updated strength.
  const p1 = (await ctx.db.get(myProfile._id))!;
  const p2 = (await ctx.db.get(opponent._id))!;
  await applySnapshot(ctx, p1, p2, iWon ? 1 : 0, matchId, season, seasonYear);
  await applySnapshot(ctx, (await ctx.db.get(p2._id))!, p1, iWon ? 0 : 1, matchId, season, seasonYear);

  return matchId;
}

async function applySnapshot(
  ctx: MutationCtx,
  player: Doc<"playerProfiles">,
  opponent: Doc<"playerProfiles">,
  score: 0 | 1,
  matchId: Id<"matches">,
  season: "summer" | "winter",
  seasonYear: number
) {
  const before = player.currentStrength;
  const delta = eloDelta(before, opponent.currentStrength, score);
  const after = before + delta;
  await ctx.db.insert("strengthSnapshots", {
    playerProfileId: player._id,
    matchId,
    strengthBefore: before,
    strengthAfter: after,
    delta,
    season,
    seasonYear,
  });
  await ctx.db.patch(player._id, { currentStrength: after });
}
