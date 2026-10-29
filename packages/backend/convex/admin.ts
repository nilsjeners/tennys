import { query } from "./_generated/server";
import { avatarUrl } from "./lib/avatar";
import { requireAdmin } from "./users";

// Admin dashboard queries (apps/web, pointed at this same deployment). Read-only.
// Gated on the signed-in user's "admin" role, so the dashboard needs a real
// Better Auth session for an admin account.

const WEEK = 7 * 24 * 60 * 60 * 1000;

// All app users joined with their tennis profile (displayName + avatar).
export const listUsers = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    return Promise.all(
      users.map(async (u) => {
        const profile = await ctx.db
          .query("playerProfiles")
          .withIndex("by_owner", (q) => q.eq("ownerUserId", u._id))
          .unique();
        return {
          id: u._id,
          email: u.email,
          roles: u.roles,
          authProvider: u.authProvider,
          createdAt: u._creationTime,
          lastActiveAt: u.lastActiveAt ?? null,
          displayName: profile?.displayName ?? null,
          avatarUrl: await avatarUrl(ctx, profile?.avatarStorageId),
        };
      })
    );
  },
});

// Headline counts for the dashboard stat tiles.
export const stats = query({
  args: {},
  handler: async (ctx) => {
    await requireAdmin(ctx);
    const users = await ctx.db.query("users").collect();
    const now = Date.now();
    return {
      total: users.length,
      activeLast7d: users.filter((u) => u.lastActiveAt && now - u.lastActiveAt < WEEK).length,
      newLast7d: users.filter((u) => now - u._creationTime < WEEK).length,
    };
  },
});
