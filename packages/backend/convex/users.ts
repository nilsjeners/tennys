import { v } from "convex/values";
import { authComponent } from "./auth";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { avatarUrl } from "./lib/avatar";

// Better Auth user shape we rely on (id + email). Cast keeps us decoupled from
// the component's full type surface. `name`/`image` come from the social
// provider (e.g. Google) when the account was created via social sign-in.
type AuthUser = { _id: string; email: string; name?: string; image?: string | null };

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
    return {
      email: au.email,
      // Only useful pre-onboarding (to prefill profile-setup); once a
      // playerProfile exists, displayName/avatarUrl above are authoritative.
      socialName: au.name ?? null,
      socialImage: au.image ?? null,
      hasProfile: !!profile,
      user,
      profile,
      avatarUrl: await avatarUrl(ctx, profile?.avatarStorageId),
    };
  },
});

// Heartbeat: stamp the signed-in user's lastActiveAt. Called once when the app
// opens (tabs layout mount). No-op when not signed in / no app user yet.
export const touchActive = mutation({
  args: {},
  handler: async (ctx) => {
    const au = await authUser(ctx);
    if (!au) return;
    const user = await appUserFor(ctx, au);
    if (!user) return;
    await ctx.db.patch(user._id, { lastActiveAt: Date.now() });
  },
});

// Persist the app-language choice on the account so it follows the user across
// devices and so server-rendered push notifications use the right language.
// `undefined` means "follow the device language". No-op when signed out — the
// client keeps its own local copy for the pre-auth screens.
export const setLanguage = mutation({
  args: { language: v.optional(v.union(v.literal("de"), v.literal("en"))) },
  handler: async (ctx, args) => {
    const au = await authUser(ctx);
    if (!au) return;
    const user = await appUserFor(ctx, au);
    if (!user) return;
    await ctx.db.patch(user._id, { language: args.language });
  },
});

// Create (or return) the app user + tennis profile for the signed-in account.
// Called after Better Auth sign-up completes (profile-setup screen).
// Frictionless onboarding (PRD): display name is the ONLY required field —
// no username/handle, no skill level.
export const createProfile = mutation({
  args: {
    displayName: v.string(),
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
      gender: "unspecified",
      handedness: "right",
      ownerUserId: userId,
      ratingSingles: 1000,
      ratingDoubles: 1000,
    });
  },
});

// Edit the signed-in user's tennis profile — display name only (PRD).
export const updateProfile = mutation({
  args: {
    displayName: v.string(),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Kein Profil — bitte zuerst anmelden.");
    const name = args.displayName.trim();
    if (!name) throw new Error("Bitte einen Anzeigenamen eingeben.");
    await ctx.db.patch(me.profile._id, { displayName: name });
    return me.profile._id;
  },
});

// GDPR account deletion: anonymize the tennis profile (name, photo, handle,
// city), flag it as deleted so it disappears from all lists/searches/setups,
// detach it from the user, drop pending friend requests + notifications, and
// delete the app user row. Match history stays intact and renders as
// "Gelöschter Spieler". (The Better-Auth login identity is not touched here;
// re-registering creates a fresh app user + profile.)
export const deleteAccount = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");

    if (me.profile.avatarStorageId) await ctx.storage.delete(me.profile.avatarStorageId);
    await ctx.db.patch(me.profile._id, {
      displayName: "Gelöschter Spieler",
      username: undefined,
      city: undefined,
      avatarStorageId: undefined,
      ownerUserId: undefined,
      isDeleted: true,
    });

    // drop pending friend requests in either direction (accepted history stays)
    const asRequester = await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", me.profile._id)).collect();
    const asRecipient = await ctx.db.query("connections").withIndex("by_recipient", (q) => q.eq("recipientPlayerProfileId", me.profile._id)).collect();
    for (const c of [...asRequester, ...asRecipient]) {
      if (c.status === "pending") await ctx.db.delete(c._id);
    }

    for (const n of await ctx.db.query("notifications").withIndex("by_recipient", (q) => q.eq("recipientUserId", me.user._id)).collect()) {
      await ctx.db.delete(n._id);
    }

    await ctx.db.delete(me.user._id);
    return { deleted: true };
  },
});
