import type { MutationCtx, QueryCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

// Resolve a profile's avatar storage id to a served URL (or null).
export async function avatarUrl(
  ctx: QueryCtx | MutationCtx,
  storageId: Id<"_storage"> | undefined
): Promise<string | null> {
  return storageId ? await ctx.storage.getUrl(storageId) : null;
}
