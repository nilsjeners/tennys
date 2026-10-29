import { v } from "convex/values";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { pushNotification } from "./notifications";
import { START_RATING } from "./lib/rating";
import { avatarUrl } from "./lib/avatar";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

async function card(ctx: QueryCtx | MutationCtx, p: Doc<"playerProfiles">) {
  return {
    profileId: p._id,
    name: p.displayName,
    initials: initials(p.displayName),
    avatarUrl: await avatarUrl(ctx, p.avatarStorageId),
    points: p.ratingSingles ?? START_RATING,
    city: p.city ?? null,
  };
}

// The connection between two profiles, regardless of direction (or null).
async function connectionBetween(
  ctx: QueryCtx | MutationCtx,
  a: Id<"playerProfiles">,
  b: Id<"playerProfiles">
): Promise<Doc<"connections"> | null> {
  const outgoing = (
    await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", a)).collect()
  ).find((c) => c.recipientPlayerProfileId === b);
  if (outgoing) return outgoing;
  const incoming = (
    await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", b)).collect()
  ).find((c) => c.recipientPlayerProfileId === a);
  return incoming ?? null;
}

// Accepted friend ids for a profile, either direction. Shared with matches.feed.
export async function acceptedFriendIds(ctx: QueryCtx | MutationCtx, myId: Id<"playerProfiles">): Promise<Id<"playerProfiles">[]> {
  const asRequester = await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", myId)).collect();
  const asRecipient = await ctx.db.query("connections").withIndex("by_recipient", (q) => q.eq("recipientPlayerProfileId", myId)).collect();
  return [
    ...asRequester.filter((c) => c.status === "accepted").map((c) => c.recipientPlayerProfileId),
    ...asRecipient.filter((c) => c.status === "accepted").map((c) => c.requesterPlayerProfileId),
  ];
}

// My accepted friends, with profile data. Deleted profiles are filtered out.
export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const myId = me.profile._id;
    const friendIds = await acceptedFriendIds(ctx, myId);
    const out = [];
    for (const id of friendIds) {
      const p = await ctx.db.get(id);
      if (!p || p.isDeleted) continue;
      out.push(await card(ctx, p));
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// All (non-deleted) players with my friend-status — powers the Freunde tab's
// realtime search. status: "friends" | "pending_out" | "pending_in" | "none".
export const browse = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const myId = me.profile._id;
    const profiles = (await ctx.db.query("playerProfiles").collect()).filter((p) => !p.isDeleted && p._id !== myId);
    const out = [];
    for (const p of profiles) {
      const conn = await connectionBetween(ctx, myId, p._id);
      let status: "friends" | "pending_out" | "pending_in" | "none" = "none";
      if (conn?.status === "accepted") status = "friends";
      else if (conn?.status === "pending") status = conn.requesterPlayerProfileId === myId ? "pending_out" : "pending_in";
      out.push({ ...(await card(ctx, p)), status, connectionId: conn?._id ?? null });
    }
    return out.sort((a, b) => a.name.localeCompare(b.name));
  },
});

// My connection status with a single profile — powers the follow/unfollow
// menu on that player's profile page.
export const statusWith = query({
  args: { profileId: v.id("playerProfiles") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me || me.profile._id === args.profileId) return { status: "none" as const, connectionId: null };
    const conn = await connectionBetween(ctx, me.profile._id, args.profileId);
    let status: "friends" | "pending_out" | "pending_in" | "none" = "none";
    if (conn?.status === "accepted") status = "friends";
    else if (conn?.status === "pending") status = conn.requesterPlayerProfileId === me.profile._id ? "pending_out" : "pending_in";
    return { status, connectionId: conn?._id ?? null };
  },
});

// Friend request from the global search (privacy: consent required). If the
// other side already requested me, both want it → accept directly. Profiles
// without an owning user (coach/seed-managed) can't consent, so they connect
// immediately — same trust model as the QR scan.
export const request = mutation({
  args: { profileId: v.id("playerProfiles") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const myId = me.profile._id;
    if (myId === args.profileId) throw new Error("Das bist du selbst.");
    const target = await ctx.db.get(args.profileId);
    if (!target || target.isDeleted) throw new Error("Spieler nicht gefunden.");

    const existing = await connectionBetween(ctx, myId, args.profileId);
    if (existing) {
      if (existing.status === "pending" && existing.recipientPlayerProfileId === myId) {
        // they already asked me — mutual intent, accept
        await ctx.db.patch(existing._id, { status: "accepted", respondedAt: Date.now() });
        if (target.ownerUserId) {
          await pushNotification(ctx, { recipientUserId: target.ownerUserId, actorUserId: me.user._id, type: "friend_accepted", connectionId: existing._id });
        }
        return { status: "friends" as const };
      }
      return { status: existing.status === "accepted" ? ("friends" as const) : ("pending_out" as const) };
    }

    if (!target.ownerUserId) {
      await ctx.db.insert("connections", { requesterPlayerProfileId: myId, recipientPlayerProfileId: args.profileId, status: "accepted", respondedAt: Date.now() });
      return { status: "friends" as const };
    }

    const connectionId = await ctx.db.insert("connections", { requesterPlayerProfileId: myId, recipientPlayerProfileId: args.profileId, status: "pending" });
    await pushNotification(ctx, { recipientUserId: target.ownerUserId, actorUserId: me.user._id, type: "friend_request", connectionId });
    return { status: "pending_out" as const };
  },
});

// Accept an incoming request (recipient only).
export const accept = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const conn = await ctx.db.get(args.connectionId);
    if (!conn || conn.status !== "pending") return;
    if (conn.recipientPlayerProfileId !== me.profile._id) throw new Error("Nur der Empfänger kann annehmen.");
    await ctx.db.patch(conn._id, { status: "accepted", respondedAt: Date.now() });
    const requester = await ctx.db.get(conn.requesterPlayerProfileId);
    if (requester?.ownerUserId) {
      await pushNotification(ctx, { recipientUserId: requester.ownerUserId, actorUserId: me.user._id, type: "friend_accepted", connectionId: conn._id });
    }
  },
});

// Decline an incoming request → the record is deleted (recipient only).
export const decline = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const conn = await ctx.db.get(args.connectionId);
    if (!conn || conn.status !== "pending") return;
    if (conn.recipientPlayerProfileId !== me.profile._id) throw new Error("Nur der Empfänger kann ablehnen.");
    await ctx.db.delete(conn._id);
  },
});

// End a friendship (unfollow). Either side of an accepted connection may do it.
export const remove = mutation({
  args: { connectionId: v.id("connections") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const conn = await ctx.db.get(args.connectionId);
    if (!conn || conn.status !== "accepted") return;
    if (conn.requesterPlayerProfileId !== me.profile._id && conn.recipientPlayerProfileId !== me.profile._id) {
      throw new Error("Keine Berechtigung.");
    }
    await ctx.db.delete(conn._id);
  },
});

// QR-scan path (viral loop): physical proximity = mutual consent, so the
// friendship is created immediately on both sides. Idempotent.
export const addDirect = mutation({
  args: { profileId: v.id("playerProfiles") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const myId = me.profile._id;
    if (myId === args.profileId) return;
    const target = await ctx.db.get(args.profileId);
    if (!target || target.isDeleted) throw new Error("Spieler nicht gefunden.");
    const existing = await connectionBetween(ctx, myId, args.profileId);
    if (existing) {
      if (existing.status !== "accepted") await ctx.db.patch(existing._id, { status: "accepted", respondedAt: Date.now() });
      return;
    }
    await ctx.db.insert("connections", { requesterPlayerProfileId: myId, recipientPlayerProfileId: args.profileId, status: "accepted", respondedAt: Date.now() });
    if (target.ownerUserId) {
      await pushNotification(ctx, { recipientUserId: target.ownerUserId, actorUserId: me.user._id, type: "friend_accepted" });
    }
  },
});
