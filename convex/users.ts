import { v } from "convex/values";
import { authComponent } from "./auth";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";

// Better Auth user shape we rely on (id + email). Cast keeps us decoupled from
// the component's full type surface.
type AuthUser = { _id: string; email: string; name?: string };

async function authUser(ctx: QueryCtx | MutationCtx): Promise<AuthUser | null> {
  try {
    return (await authComponent.getAuthUser(ctx)) as AuthUser | null;
  } catch {
    return null;
  }
}

async function appUserFor(ctx: QueryCtx | MutationCtx, au: AuthUser): Promise<Doc<"users"> | null> {
  return ctx.db
    .query("users")
    .withIndex("by_authId", (q) => q.eq("authId", au._id))
    .unique();
}

export async function currentProfile(
  ctx: QueryCtx | MutationCtx
): Promise<{ user: Doc<"users">; profile: Doc<"playerProfiles"> } | null> {
  const au = await authUser(ctx);
  if (!au) return null;
  const user = await appUserFor(ctx, au);
  if (!user) return null;
  const profile = await ctx.db
    .query("playerProfiles")
    .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
    .unique();
  if (!profile) return null;
  return { user, profile };
}

// The signed-in account + tennis profile, or null when not signed in / no profile yet.
export const me = query({
  args: {},
  handler: async (ctx) => {
    const au = await authUser(ctx);
    if (!au) return null;
    const user = await appUserFor(ctx, au);
    const profile = user
      ? await ctx.db
          .query("playerProfiles")
          .withIndex("by_owner", (q) => q.eq("ownerUserId", user._id))
          .unique()
      : null;
    return { email: au.email, hasProfile: !!profile, user, profile };
  },
});

// Create (or return) the app user + tennis profile for the signed-in account.
// Called after Better Auth sign-up completes (profile-setup screen).
export const createProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("pro")),
    gender: v.optional(v.string()),
    handedness: v.optional(v.union(v.literal("left"), v.literal("right"))),
    city: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const au = await authUser(ctx);
    if (!au) throw new Error("Nicht angemeldet.");

    let user = await appUserFor(ctx, au);
    let userId: Id<"users">;
    if (user) {
      userId = user._id;
    } else {
      userId = await ctx.db.insert("users", {
        email: au.email,
        authProvider: "password",
        roles: ["player"],
        authId: au._id,
      });
    }

    const existing = await ctx.db
      .query("playerProfiles")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", userId))
      .unique();
    if (existing) return existing._id;

    return ctx.db.insert("playerProfiles", {
      displayName: args.displayName,
      username: args.username,
      gender: args.gender ?? "unspecified",
      handedness: args.handedness ?? "right",
      skillLevel: args.skillLevel,
      city: args.city,
      ownerUserId: userId,
      currentStrength: 1000,
    });
  },
});

// Edit the signed-in user's tennis profile (Profil bearbeiten).
export const updateProfile = mutation({
  args: {
    displayName: v.string(),
    username: v.string(),
    city: v.optional(v.string()),
    skillLevel: v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("pro")),
    handedness: v.optional(v.union(v.literal("left"), v.literal("right"))),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Kein Profil — bitte zuerst anmelden.");
    await ctx.db.patch(me.profile._id, {
      displayName: args.displayName,
      username: args.username.replace(/^@/, ""),
      city: args.city,
      skillLevel: args.skillLevel,
      ...(args.handedness ? { handedness: args.handedness } : {}),
    });
    return me.profile._id;
  },
});
