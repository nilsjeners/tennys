import { v } from "convex/values";
import { mutation, query, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { setsWonByTeam1 } from "./lib/tennis";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// wins / total completed matches per profile id.
async function tallyRecords(ctx: QueryCtx): Promise<Map<string, { wins: number; total: number }>> {
  const rec = new Map<string, { wins: number; total: number }>();
  const bump = (id: Id<"playerProfiles">, won: boolean) => {
    const r = rec.get(id) ?? { wins: 0, total: 0 };
    r.total++;
    if (won) r.wins++;
    rec.set(id, r);
  };
  const matches = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect());
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

// Leaderboard: ordered by currentStrength (data model), showing wins + win%.
export const ranking = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    const profiles = await ctx.db.query("playerProfiles").collect();
    const rec = await tallyRecords(ctx);
    return profiles
      .slice()
      .sort((a, b) => b.currentStrength - a.currentStrength)
      .map((p, i) => {
        const r = rec.get(p._id) ?? { wins: 0, total: 0 };
        return {
          rank: i + 1,
          profileId: p._id,
          name: p.displayName,
          initials: initials(p.displayName),
          wins: r.wins,
          pct: r.total ? Math.round((r.wins / r.total) * 100) : 0,
          you: me?.profile._id === p._id,
        };
      });
  },
});

// Other players to discover / challenge.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    const profiles = await ctx.db.query("playerProfiles").collect();
    return profiles
      .filter((p) => p._id !== me?.profile._id)
      .map((p) => ({
        profileId: p._id,
        name: p.displayName,
        initials: initials(p.displayName),
        skillLevel: p.skillLevel ?? null,
      }));
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
