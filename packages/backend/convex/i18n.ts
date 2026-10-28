import { v } from "convex/values";
import { internalMutation, query } from "./_generated/server";
import { LOCALES, LOCALE_CODES } from "./lib/locales";

export const localeArg = v.union(v.literal("de"), v.literal("en"));

// The editable override layer for one locale. Returns only the rows that exist
// in the table — the client merges these over the bundled strings, so an empty
// table (fresh deploy, before `i18n:seed`) is a valid state, not an outage.
export const bundle = query({
  args: { locale: localeArg },
  handler: async (ctx, args) => {
    const rows = await ctx.db
      .query("translations")
      .withIndex("by_locale", (q) => q.eq("locale", args.locale))
      .collect();
    const out: Record<string, string> = {};
    for (const r of rows) out[r.key] = r.value;
    return out;
  },
});

// Push the bundled strings into the table so they show up as editable rows:
//   npx convex run i18n:seed
// Existing rows are left untouched — re-running after adding keys to
// lib/locales.ts inserts only what's new and never clobbers dashboard edits.
// Pass '{"overwrite":true}' to reset every row back to the source file.
export const seed = internalMutation({
  args: { overwrite: v.optional(v.boolean()) },
  handler: async (ctx, args) => {
    let inserted = 0;
    let updated = 0;
    for (const locale of LOCALE_CODES) {
      const existing = new Map(
        (
          await ctx.db
            .query("translations")
            .withIndex("by_locale", (q) => q.eq("locale", locale))
            .collect()
        ).map((r) => [r.key, r])
      );
      for (const [key, value] of Object.entries(LOCALES[locale])) {
        const row = existing.get(key);
        if (!row) {
          await ctx.db.insert("translations", { locale, key, value });
          inserted++;
        } else if (args.overwrite && row.value !== value) {
          await ctx.db.patch(row._id, { value });
          updated++;
        }
      }
    }
    return { inserted, updated };
  },
});
