import { v } from "convex/values";
import { mutation, query, internalQuery, internalMutation, internalAction, type MutationCtx } from "./_generated/server";
import { api, internal } from "./_generated/api";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { avatarUrl } from "./lib/avatar";
import { DEFAULT_LOCALE, LOCALES, interpolate } from "./lib/locales";

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

type NotificationType = Doc<"notifications">["type"];

// Shared insert used by friends.ts / comments.ts / reactions.ts. Never notifies
// the actor about their own action.
export async function pushNotification(
  ctx: MutationCtx,
  args: {
    recipientUserId: Id<"users">;
    actorUserId: Id<"users">;
    type: NotificationType;
    matchId?: Id<"matches">;
    connectionId?: Id<"connections">;
  }
) {
  if (args.recipientUserId === args.actorUserId) return;
  await ctx.db.insert("notifications", {
    recipientUserId: args.recipientUserId,
    type: args.type,
    payload: { fromUserId: args.actorUserId, matchId: args.matchId, connectionId: args.connectionId },
    isRead: false,
  });
  // Fire-and-forget device push — the HTTP call can't happen inside a mutation.
  await ctx.scheduler.runAfter(0, internal.notifications.sendExpoPush, {
    recipientUserId: args.recipientUserId,
    actorUserId: args.actorUserId,
    type: args.type,
  });
}

// Register (or replace) the signed-in user's push token. One active token per
// user for MVP — reinstalls/new devices simply overwrite the prior row.
export const registerPushToken = mutation({
  args: { token: v.string(), platform: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const existing = await ctx.db
      .query("pushTokens")
      .withIndex("by_user", (q) => q.eq("userId", me.user._id))
      .collect();
    for (const row of existing) await ctx.db.delete(row._id);
    await ctx.db.insert("pushTokens", { userId: me.user._id, token: args.token, platform: args.platform });
  },
});

// Where to send, and in which language: the push text is rendered server-side,
// so it follows the recipient's saved language choice (device default when unset).
export const pushTargetForUser = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("pushTokens").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    const user = await ctx.db.get(args.userId);
    return { tokens: rows.map((r) => r.token), locale: user?.language ?? DEFAULT_LOCALE };
  },
});

// Same lookup as list()'s actorName resolution. Returns null when there is no
// profile so the caller can substitute a translated "someone".
export const actorDisplayName = internalQuery({
  args: { userId: v.id("users") },
  handler: async (ctx, args) => {
    const profile = await ctx.db
      .query("playerProfiles")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", args.userId))
      .unique();
    return profile?.displayName ?? null;
  },
});

// Token is dead (app uninstalled etc.) — remove it so it doesn't accumulate.
export const deleteDeadToken = internalMutation({
  args: { userId: v.id("users"), token: v.string() },
  handler: async (ctx, args) => {
    const rows = await ctx.db.query("pushTokens").withIndex("by_user", (q) => q.eq("userId", args.userId)).collect();
    for (const row of rows) {
      if (row.token === args.token) await ctx.db.delete(row._id);
    }
  },
});

// Sends the actual device push via Expo's push API. Runs as an action (not a
// mutation) because it needs fetch. Scheduled fire-and-forget from pushNotification.
export const sendExpoPush = internalAction({
  args: {
    recipientUserId: v.id("users"),
    actorUserId: v.id("users"),
    type: v.union(v.literal("friend_request"), v.literal("friend_accepted"), v.literal("comment"), v.literal("reaction"), v.literal("match_result"), v.literal("new_match"), v.literal("live_started"), v.literal("live_cancelled")),
  },
  handler: async (ctx, args) => {
    const { tokens, locale } = await ctx.runQuery(internal.notifications.pushTargetForUser, { userId: args.recipientUserId });
    if (tokens.length === 0) return;

    // Same override-then-bundled fallback the client uses, so dashboard edits
    // to push copy take effect without a redeploy.
    const overrides: Record<string, string> = await ctx.runQuery(api.i18n.bundle, { locale });
    const tr = (key: string, vars?: Record<string, string | number>) =>
      interpolate(overrides[key] ?? LOCALES[locale][key] ?? LOCALES[DEFAULT_LOCALE][key] ?? key, vars);

    const actorName = (await ctx.runQuery(internal.notifications.actorDisplayName, { userId: args.actorUserId })) ?? tr("common.someone");
    const title = tr(`push.${args.type}.title`);
    const body = tr(`push.${args.type}.body`, { name: actorName });
    const res = await fetch("https://exp.host/--/api/v2/push/send", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(tokens.map((to) => ({ to, title, body }))),
    });
    const json = await res.json();
    const tickets: { status: string; details?: { error?: string } }[] = json?.data ?? [];
    await Promise.all(
      tickets.map((ticket, i) => {
        if (ticket.status === "error" && ticket.details?.error === "DeviceNotRegistered") {
          return ctx.runMutation(internal.notifications.deleteDeadToken, { userId: args.recipientUserId, token: tokens[i] });
        }
      })
    );
  },
});

// Badge count for the bell.
export const unreadCount = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return 0;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientUserId", me.user._id).eq("isRead", false))
      .collect();
    return unread.length;
  },
});

// Notification feed, newest first. Resolves the actor's profile for display and
// whether a friend_request is still actionable (connection still pending).
export const list = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const rows = (
      await ctx.db
        .query("notifications")
        .withIndex("by_recipient", (q) => q.eq("recipientUserId", me.user._id))
        .collect()
    )
      .sort((a, b) => b._creationTime - a._creationTime)
      .slice(0, 50);

    return Promise.all(
      rows.map(async (n) => {
        // null = no profile behind the actor; the client renders a translated
        // "someone" rather than a German string baked in here.
        let actorName: string | null = null;
        let actorInitials = "?";
        let actorAvatarUrl: string | null = null;
        if (n.payload.fromUserId) {
          const profile = await ctx.db
            .query("playerProfiles")
            .withIndex("by_owner", (q) => q.eq("ownerUserId", n.payload.fromUserId!))
            .unique();
          if (profile) {
            actorName = profile.displayName;
            actorInitials = initials(profile.displayName);
            actorAvatarUrl = await avatarUrl(ctx, profile.avatarStorageId);
          }
        }
        // friend_request stays actionable only while the connection is pending
        let pending = false;
        if (n.type === "friend_request" && n.payload.connectionId) {
          const conn = await ctx.db.get(n.payload.connectionId);
          pending = conn?.status === "pending";
        }
        // Deleted matches (cancelled live game, or a completed match the
        // creator removed) leave old notifications pointing nowhere — drop
        // the link rather than send the tap to a match that no longer exists.
        const matchId = n.payload.matchId && (await ctx.db.get(n.payload.matchId)) ? n.payload.matchId : null;
        return {
          id: n._id,
          type: n.type,
          isRead: n.isRead,
          createdAt: n._creationTime,
          matchId,
          connectionId: n.payload.connectionId ?? null,
          pending,
          actorName,
          actorInitials,
          actorAvatarUrl,
        };
      })
    );
  },
});

// Called when the notifications screen opens.
export const markAllRead = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return;
    const unread = await ctx.db
      .query("notifications")
      .withIndex("by_recipient", (q) => q.eq("recipientUserId", me.user._id).eq("isRead", false))
      .collect();
    for (const n of unread) await ctx.db.patch(n._id, { isRead: true });
  },
});
