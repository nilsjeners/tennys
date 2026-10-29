import { mutation } from "./_generated/server";
import type { Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { logCompletedMatch } from "./matches";
import { seasonForDate } from "./lib/tennis";

const DAY = 24 * 60 * 60 * 1000;

type Opp = { name: string; username: string; skill: "beginner" | "intermediate" | "pro"; strength: number; city: string };

const OPPONENTS: Opp[] = [
  { name: "Marcus R.", username: "marcusr", skill: "pro", strength: 1180, city: "München" },
  { name: "Sam K.", username: "samk", skill: "pro", strength: 1120, city: "München" },
  { name: "Tom C.", username: "tomc", skill: "intermediate", strength: 1040, city: "Augsburg" },
  { name: "Jamie K.", username: "jamiek", skill: "intermediate", strength: 1000, city: "München" },
  { name: "Alex L.", username: "alexl", skill: "beginner", strength: 960, city: "Dachau" },
  { name: "Lena M.", username: "lenam", skill: "intermediate", strength: 1060, city: "München" },
  { name: "David H.", username: "davidh", skill: "intermediate", strength: 980, city: "München" },
  { name: "Paul K.", username: "paulk", skill: "intermediate", strength: 1010, city: "Freising" },
  { name: "Sophie F.", username: "sophief", skill: "pro", strength: 1090, city: "München" },
  { name: "Robin T.", username: "robint", skill: "beginner", strength: 940, city: "München" },
];

// Populate demo data for the signed-in user. Idempotent: no-op if data exists.
export const run = mutation({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Kein Profil — bitte zuerst anlegen.");

    const alreadyMine = await ctx.db
      .query("matches")
      .withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id))
      .first();
    if (alreadyMine) return { seeded: false };

    // Opponents (private profiles, no owning user).
    const ids: Record<string, Id<"playerProfiles">> = {};
    for (const o of OPPONENTS) {
      ids[o.name] = await ctx.db.insert("playerProfiles", {
        displayName: o.name,
        username: o.username,
        gender: "unspecified",
        handedness: "right",
        skillLevel: o.skill,
        city: o.city,
        ratingSingles: o.strength,
        ratingDoubles: o.strength,
        createdByCoachId: me.user._id,
      });
    }

    // Demo opponents double as the initial friends list (match setup shows
    // friends only), so link them right away.
    for (const id of Object.values(ids)) {
      await ctx.db.insert("connections", {
        requesterPlayerProfileId: me.profile._id,
        recipientPlayerProfileId: id,
        status: "accepted",
        respondedAt: Date.now(),
      });
    }

    const now = Date.now();
    const opp = async (name: string) => (await ctx.db.get(ids[name]))!;

    // Completed history (drives history, ranking, stats, monthly chart).
    const log = async (name: string, daysAgo: number, sets: [number, number][]) =>
      logCompletedMatch(ctx, {
        team1: [me.profile],
        team2: [await opp(name)],
        createdByUserId: me.user._id,
        sets: sets.map(([a, b]) => ({ team1Games: a, team2Games: b })),
        dateTime: now - daysAgo * DAY,
        place: "Stadtpark",
      });

    await log("Marcus R.", 8, [[6, 3], [6, 4]]);
    await log("Jamie K.", 10, [[4, 6], [5, 7]]);
    await log("Sam K.", 12, [[6, 1], [6, 3]]);
    await log("Tom C.", 15, [[7, 5], [6, 4]]);
    await log("Alex L.", 22, [[6, 2], [6, 2]]);
    await log("David H.", 40, [[6, 4], [3, 6], [6, 4]]);
    await log("Paul K.", 55, [[6, 0], [6, 1]]);
    await log("Sophie F.", 70, [[3, 6], [4, 6]]);

    // Doubles history (drives ratingDoubles + unlocks a Team-Lounge with Lena M.).
    const logDoubles = async (partner: string, oppA: string, oppB: string, daysAgo: number, sets: [number, number][]) =>
      logCompletedMatch(ctx, {
        team1: [me.profile, await opp(partner)],
        team2: [await opp(oppA), await opp(oppB)],
        createdByUserId: me.user._id,
        sets: sets.map(([a, b]) => ({ team1Games: a, team2Games: b })),
        dateTime: now - daysAgo * DAY,
        place: "Stadtpark",
      });

    await logDoubles("Lena M.", "Sam K.", "Tom C.", 6, [[6, 4], [6, 3]]);
    await logDoubles("Lena M.", "Marcus R.", "Jamie K.", 20, [[4, 6], [6, 7]]);
    await logDoubles("Lena M.", "Sam K.", "Alex L.", 34, [[6, 2], [6, 4]]);

    // Upcoming scheduled match (Home "Dein nächstes Match").
    const today18 = new Date();
    today18.setHours(18, 0, 0, 0);
    const { season, seasonYear } = seasonForDate(today18.getTime());
    await ctx.db.insert("matches", {
      type: "singles",
      status: "scheduled",
      dateTime: today18.getTime(),
      scheduledFor: today18.getTime(),
      place: "Stadtpark · Court 3",
      season,
      seasonYear,
      team1PlayerIds: [me.profile._id],
      team2PlayerIds: [ids["Marcus R."]],
      createdByUserId: me.user._id,
    });

    // Live match in progress (Home "Live") — partial result holds the running score.
    const liveId = await ctx.db.insert("matches", {
      type: "singles",
      status: "live",
      dateTime: now,
      place: "Stadtpark",
      season: seasonForDate(now).season,
      seasonYear: seasonForDate(now).seasonYear,
      team1PlayerIds: [me.profile._id],
      team2PlayerIds: [ids["Sam K."]],
      createdByUserId: me.user._id,
    });
    await ctx.db.insert("matchResults", {
      matchId: liveId,
      sets: [
        { team1Games: 6, team2Games: 4 },
        { team1Games: 3, team2Games: 2 },
      ],
      isRetirement: false,
      isWalkover: false,
      team1TotalGames: 9,
      team2TotalGames: 6,
    });

    return { seeded: true };
  },
});
