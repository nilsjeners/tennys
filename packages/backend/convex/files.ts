import { v } from "convex/values";
import { mutation } from "./_generated/server";
import { currentProfile } from "./users";

// Short-lived URL the client POSTs the image to. Returns a storageId.
export const generateUploadUrl = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    return ctx.storage.generateUploadUrl();
  },
});

// Set the signed-in user's avatar to an uploaded file; clean up the previous one.
export const setAvatar = mutation({
  args: { storageId: v.id("_storage") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const old = me.profile.avatarStorageId;
    await ctx.db.patch(me.profile._id, { avatarStorageId: args.storageId });
    if (old && old !== args.storageId) await ctx.storage.delete(old);
  },
});

export const removeAvatar = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    if (me.profile.avatarStorageId) {
      await ctx.storage.delete(me.profile.avatarStorageId);
      await ctx.db.patch(me.profile._id, { avatarStorageId: undefined });
    }
  },
});
