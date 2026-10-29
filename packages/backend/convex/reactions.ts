import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { currentProfile } from "./users";
import { notifyParticipants } from "./comments";

const reactionType = v.union(v.literal("like"), v.literal("tennis_ball"), v.literal("fire"), v.literal("strong"));

// Toggle the signed-in user's reaction on a match. One row per (match,user):
// re-reacting with the same type removes it; a different type replaces it.
// (Locked product rule.)
export const toggle = mutation({
  args: { matchId: v.id("matches"), type: reactionType },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const existing = await ctx.db
      .query("reactions")
      .withIndex("by_match_user", (q) => q.eq("matchId", args.matchId).eq("userId", me.user._id))
      .unique();
    if (!existing) {
      await ctx.db.insert("reactions", { matchId: args.matchId, userId: me.user._id, type: args.type });
      // notify only on creation, not on type-change/removal
      await notifyParticipants(ctx, args.matchId, me.user._id, "reaction");
      return { type: args.type };
    }
    if (existing.type === args.type) {
      await ctx.db.delete(existing._id);
      return { type: null };
    }
    await ctx.db.patch(existing._id, { type: args.type });
    return { type: args.type };
  },
});

// Reaction summary for a match: total + my current reaction.
export const forMatch = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    const all = await ctx.db.query("reactions").withIndex("by_match", (q) => q.eq("matchId", args.matchId)).collect();
    const mine = me ? all.find((r) => r.userId === me.user._id) ?? null : null;
    return { total: all.length, mine: mine?.type ?? null };
  },
});
