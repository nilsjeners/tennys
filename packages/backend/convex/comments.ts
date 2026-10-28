import { v } from "convex/values";
import { mutation, query, type MutationCtx } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { pushNotification } from "./notifications";
import { avatarUrl } from "./lib/avatar";

// Notify every match participant (profile owners) except the actor.
export async function notifyParticipants(
  ctx: MutationCtx,
  matchId: Id<"matches">,
  actorUserId: Id<"users">,
  type: "comment" | "reaction"
) {
  const match = await ctx.db.get(matchId);
  if (!match) return;
  for (const pid of [...match.team1PlayerIds, ...match.team2PlayerIds]) {
    const p = await ctx.db.get(pid);
    if (p?.ownerUserId) {
      await pushNotification(ctx, { recipientUserId: p.ownerUserId, actorUserId, type, matchId });
    }
  }
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

// Comment thread for a match, oldest → newest.
export const list = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    const rows = (await ctx.db.query("comments").withIndex("by_match", (q) => q.eq("matchId", args.matchId)).collect()).sort(
      (a, b) => a._creationTime - b._creationTime
    );
    return Promise.all(
      rows.map(async (c) => {
        // author's tennis profile (for name + avatar)
        const profile = await ctx.db
          .query("playerProfiles")
          .withIndex("by_owner", (q) => q.eq("ownerUserId", c.authorUserId))
          .unique();
        const name = profile?.displayName ?? "Spieler";
        return {
          id: c._id,
          text: c.text,
          name,
          initials: initials(name),
          avatarUrl: await avatarUrl(ctx, profile?.avatarStorageId),
          profileId: profile?._id ?? null,
          isMe: c.authorUserId === me?.user._id,
        };
      })
    );
  },
});

// Add a comment to a match as the signed-in user.
export const add = mutation({
  args: { matchId: v.id("matches"), text: v.string() },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const text = args.text.trim();
    if (!text) throw new Error("Kommentar ist leer.");
    const id = await ctx.db.insert("comments", { matchId: args.matchId, authorUserId: me.user._id, text });
    await notifyParticipants(ctx, args.matchId, me.user._id, "comment");
    return id;
  },
});

// Remove one's own comment.
export const remove = mutation({
  args: { commentId: v.id("comments") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const c = await ctx.db.get(args.commentId);
    if (!c) return;
    if (c.authorUserId !== me.user._id) throw new Error("Nur eigene Kommentare löschbar.");
    await ctx.db.delete(args.commentId);
  },
});
