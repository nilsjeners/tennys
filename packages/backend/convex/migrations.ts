import { action, internalMutation, mutation, type MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { components, internal } from "./_generated/api";
import type { Id } from "./_generated/dataModel";
import { START_RATING } from "./lib/rating";
import { logCompletedMatch } from "./matches";
import { createAuth } from "./auth";
import { Migrations } from "@convex-dev/migrations";
import schema from "./schema";

// Batched, resumable schema migrations (@convex-dev/migrations). Define new ones
// with migrations.define({ table, migrateOne }) and run them with
//   npx convex run migrations:run '{"fn": "migrations:<name>"}'
export const migrations = new Migrations(components.migrations, { schema });
export const run = migrations.runner();

// Shared login for every seeded test player (see setupTestData).
const TEST_PASSWORD = "tennys123";

// One-off backfill for the friends model: link every owned profile with the
// seed opponents its user created (coach profiles), so existing dev accounts
// keep a populated friends list in match setup. Idempotent.
//   npx convex run migrations:linkSeedFriends
export const linkSeedFriends = mutation({
  args: {},
  handler: async (ctx) => {
    let created = 0;
    const profiles = await ctx.db.query("playerProfiles").collect();
    const owned = profiles.filter((p) => p.ownerUserId && !p.isDeleted);
    for (const me of owned) {
      const mine = profiles.filter((p) => p.createdByCoachId === me.ownerUserId && p._id !== me._id && !p.isDeleted);
      for (const other of mine) {
        const existing =
          (await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", me._id)).collect()).some(
            (c) => c.recipientPlayerProfileId === other._id
          ) ||
          (await ctx.db.query("connections").withIndex("by_requester", (q) => q.eq("requesterPlayerProfileId", other._id)).collect()).some(
            (c) => c.recipientPlayerProfileId === me._id
          );
        if (existing) continue;
        await ctx.db.insert("connections", { requesterPlayerProfileId: me._id, recipientPlayerProfileId: other._id, status: "accepted", respondedAt: Date.now() });
        created++;
      }
    }
    return { created };
  },
});

// One-off backfill for the TPRS v2 migration. Idempotent — safe to re-run.
// Run once against the dev deployment after deploying the new schema:
//   npx convex run migrations:backfillRatings
export const backfillRatings = mutation({
  args: {},
  handler: async (ctx) => {
    let profilesPatched = 0;
    let snapshotsPatched = 0;

    // playerProfiles: seed both discipline ratings from the legacy currentStrength.
    for (const p of await ctx.db.query("playerProfiles").collect()) {
      const patch: Record<string, number> = {};
      if (p.ratingSingles === undefined) patch.ratingSingles = p.currentStrength ?? START_RATING;
      if (p.ratingDoubles === undefined) patch.ratingDoubles = p.currentStrength ?? START_RATING;
      if (Object.keys(patch).length) {
        await ctx.db.patch(p._id, patch);
        profilesPatched++;
      }
    }

    // strengthSnapshots: derive discipline from the owning match's type.
    for (const s of await ctx.db.query("strengthSnapshots").collect()) {
      if (s.discipline !== undefined) continue;
      const match = await ctx.db.get(s.matchId);
      const discipline = match?.type === "doubles" ? "doubles" : "singles";
      await ctx.db.patch(s._id, { discipline });
      snapshotsPatched++;
    }

    return { profilesPatched, snapshotsPatched };
  },
});

const TEST_PLAYER_NAMES = ["Adam", "Bob", "Clara", "Daniela", "Emma", "Frauke", "Gustav"];

// Wipes all app + Better Auth tables and creates the admin user. Split out of
// setupTestData (an action) because it's a plain fast mutation.
export const clearTablesAndCreateAdmin = internalMutation({
  args: {},
  handler: async (ctx) => {
    const tables = [
      "reactions",
      "comments",
      "notifications",
      "connections",
      "teamPlays",
      "strengthSnapshots",
      "matchResults",
      "matches",
      "posts",
      "media",
      "playerProfiles",
      "users",
      "accounts", // Better Auth
      "sessions", // Better Auth
      "verifications", // Better Auth
    ];

    for (const table of tables) {
      const all = await ctx.db.query(table as any).collect();
      for (const row of all) {
        await ctx.db.delete(row._id);
      }
    }

    return ctx.db.insert("users", {
      email: "admin@email.de",
      authProvider: "password",
      roles: ["admin"],
      authId: "admin-test-user",
    });
  },
});

// Creates the app-side users/playerProfiles rows for already-signed-up test
// players, plus 4 test matches between Adam and Bob and a full friend mesh.
// Split out of setupTestData (an action) because it's a plain fast mutation.
export const seedTestPlayersAndMatches = internalMutation({
  args: {
    players: v.array(v.object({ name: v.string(), email: v.string(), authId: v.string() })),
  },
  handler: async (ctx, { players }) => {
    const profiles: Record<string, Id<"playerProfiles">> = {};
    const userIds: Record<string, Id<"users">> = {};

    for (const { name, email, authId } of players) {
      const userId = await ctx.db.insert("users", {
        email,
        authProvider: "password",
        roles: ["player"],
        authId,
      });
      userIds[name] = userId;
      profiles[name] = await ctx.db.insert("playerProfiles", {
        displayName: name,
        gender: name === "Adam" || name === "Bob" || name === "Gustav" ? "male" : "female",
        handedness: "right",
        ownerUserId: userId,
        ratingSingles: START_RATING,
        ratingDoubles: START_RATING,
      });
    }

    // Create 4 matches between Adam and Bob with different results. The
    // winner is the creator (createdByUserId) in each — matches only show up
    // in their creator's own feed/history, so both Adam and Bob need to have
    // "logged" at least one to see recent matches on their home screen.
    const adam = (await ctx.db.get(profiles["Adam"]))!;
    const bob = (await ctx.db.get(profiles["Bob"]))!;

    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;

    // Match 1: Adam wins 6:4, 6:3 (3 days ago)
    await logCompletedMatch(ctx, {
      team1: [adam],
      team2: [bob],
      createdByUserId: userIds["Adam"],
      sets: [
        { team1Games: 6, team2Games: 4 },
        { team1Games: 6, team2Games: 3 },
      ],
      dateTime: now - 3 * DAY,
      place: "Stadtpark",
    });

    // Match 2: Bob wins 6:2, 6:4 (7 days ago)
    await logCompletedMatch(ctx, {
      team1: [adam],
      team2: [bob],
      createdByUserId: userIds["Bob"],
      sets: [
        { team1Games: 2, team2Games: 6 },
        { team1Games: 4, team2Games: 6 },
      ],
      dateTime: now - 7 * DAY,
      place: "Stadtpark",
    });

    // Match 3: Adam wins 7:5, 6:4 (14 days ago)
    await logCompletedMatch(ctx, {
      team1: [adam],
      team2: [bob],
      createdByUserId: userIds["Adam"],
      sets: [
        { team1Games: 7, team2Games: 5 },
        { team1Games: 6, team2Games: 4 },
      ],
      dateTime: now - 14 * DAY,
      place: "Stadtpark",
    });

    // Match 4: Bob wins 6:3, 7:6 (21 days ago)
    await logCompletedMatch(ctx, {
      team1: [adam],
      team2: [bob],
      createdByUserId: userIds["Bob"],
      sets: [
        { team1Games: 3, team2Games: 6 },
        { team1Games: 6, team2Games: 7 },
      ],
      dateTime: now - 21 * DAY,
      place: "Stadtpark",
    });

    // Connect all players as friends
    const profileIds = Object.values(profiles);
    for (let i = 0; i < profileIds.length; i++) {
      for (let j = i + 1; j < profileIds.length; j++) {
        await ctx.db.insert("connections", {
          requesterPlayerProfileId: profileIds[i],
          recipientPlayerProfileId: profileIds[j],
          status: "accepted",
          respondedAt: now,
        });
      }
    }

    return { connections: (players.length * (players.length - 1)) / 2 };
  },
});

// Reset database and create 7 test players (each with a real Better Auth
// login, e.g. adam@tennys.test / tennys123) plus 4 test matches between Adam
// and Bob. An action because Better Auth's password hashing per sign-up is
// too slow to fit inside a mutation's 1s execution budget for 7 players.
// Usage: npx convex run migrations:setupTestData
export const setupTestData = action({
  args: {},
  handler: async (ctx): Promise<{
    message: string;
    players: string[];
    matches: number;
    connections: number;
    logins: { name: string; email: string }[];
    password: string;
  }> => {
    await ctx.runMutation(internal.migrations.clearTablesAndCreateAdmin, {});

    const players = [];
    for (const name of TEST_PLAYER_NAMES) {
      const email = `${name.toLowerCase()}@tennys.test`;
      // clearTablesAndCreateAdmin only wipes our app tables, not the Better
      // Auth component's own storage — so re-running this against a deployment
      // that was already seeded hits an existing login. Sign in and reuse it
      // instead of failing.
      let authUser;
      try {
        authUser = (await createAuth(ctx).api.signUpEmail({ body: { name, email, password: TEST_PASSWORD } })).user;
      } catch {
        authUser = (await createAuth(ctx).api.signInEmail({ body: { email, password: TEST_PASSWORD } })).user;
      }
      players.push({ name, email: authUser.email, authId: authUser.id });
    }

    const { connections } = await ctx.runMutation(internal.migrations.seedTestPlayersAndMatches, {
      players,
    });

    return {
      message: "Database reset complete",
      players: TEST_PLAYER_NAMES,
      matches: 4,
      connections,
      logins: players.map(({ name, email }) => ({ name, email })),
      password: TEST_PASSWORD,
    };
  },
});

const REAL_USER_EMAIL = "nils.jeners@gmail.com";
const DEMO_PLAYER_NAMES = ["Adam", "Bob", "Clara", "Daniel", "Emma", "Frauke", "Gustav"];
const DEMO_DAY_WINDOW = 14; // "letzte zwei Wochen"
const DEMO_MAX_MATCHES_PER_PLAYER = 20;

function randomDemoSets(): { team1Games: number; team2Games: number }[] {
  const winSet = (team1Wins: boolean) => {
    // Real set scores only: 6-0..6-4, or a tiebreak-range 7-5 / 7-6.
    const tiebreak = Math.random() < 0.2;
    const winnerGames = tiebreak ? 7 : 6;
    const loserGames = tiebreak ? (Math.random() < 0.5 ? 5 : 6) : Math.floor(Math.random() * 5);
    return team1Wins ? { team1Games: winnerGames, team2Games: loserGames } : { team1Games: loserGames, team2Games: winnerGames };
  };
  const team1Wins = Math.random() < 0.5;
  const sets = [winSet(team1Wins), winSet(team1Wins)];
  if (Math.random() < 0.3) {
    sets[Math.random() < 0.5 ? 0 : 1] = winSet(!team1Wins);
    sets.push(winSet(team1Wins));
  }
  return sets;
}

// Wipes everything except the one real (Better Auth) user + their profile,
// recreates the 7 named demo players (unclaimed, coach-created by the real
// user) if missing, and logs ~14 days of singles + doubles history between
// them (capped at 20 matches per player).
// Usage: npx convex run migrations:resetDemoData
export const resetDemoData = mutation({
  args: {},
  handler: async (ctx) => {
    const realUser = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", REAL_USER_EMAIL))
      .unique();
    if (!realUser) throw new Error(`Echter User (${REAL_USER_EMAIL}) nicht gefunden.`);

    const realProfile = await ctx.db
      .query("playerProfiles")
      .withIndex("by_owner", (q) => q.eq("ownerUserId", realUser._id))
      .unique();

    const wipeTables = [
      "reactions",
      "comments",
      "notifications",
      "connections",
      "teamPlays",
      "strengthSnapshots",
      "matchResults",
      "matches",
      "posts",
      "media",
      "pushTokens",
      "clubs",
    ] as const;
    for (const table of wipeTables) {
      for (const row of await ctx.db.query(table).collect()) await ctx.db.delete(row._id);
    }
    for (const p of await ctx.db.query("playerProfiles").collect()) {
      if (realProfile && p._id === realProfile._id) continue;
      await ctx.db.delete(p._id);
    }
    for (const u of await ctx.db.query("users").collect()) {
      if (u._id === realUser._id) continue;
      await ctx.db.delete(u._id);
    }

    const existing = await ctx.db.query("playerProfiles").collect();
    const ids: Record<string, Id<"playerProfiles">> = {};
    for (const name of DEMO_PLAYER_NAMES) {
      const found = existing.find((p) => p.displayName === name);
      ids[name] = found
        ? found._id
        : await ctx.db.insert("playerProfiles", {
            displayName: name,
            gender: "unspecified",
            handedness: "right",
            ratingSingles: START_RATING,
            ratingDoubles: START_RATING,
            createdByCoachId: realUser._id,
          });
    }

    const DAY = 24 * 60 * 60 * 1000;
    const now = Date.now();
    const counts: Record<string, number> = Object.fromEntries(DEMO_PLAYER_NAMES.map((n) => [n, 0]));
    const byCount = () => [...DEMO_PLAYER_NAMES].sort(() => Math.random() - 0.5).sort((a, b) => counts[a] - counts[b]);

    let matchesCreated = 0;
    let guard = 0;
    while (DEMO_PLAYER_NAMES.some((n) => counts[n] < DEMO_MAX_MATCHES_PER_PLAYER) && guard < 1000) {
      guard++;
      const eligible = byCount().filter((n) => counts[n] < DEMO_MAX_MATCHES_PER_PLAYER);
      if (eligible.length < 2) break;
      const doubles = eligible.length >= 4 && Math.random() < 0.5;
      const chosen = eligible.slice(0, doubles ? 4 : 2);

      const team1 = [(await ctx.db.get(ids[chosen[0]]))!, ...(doubles ? [(await ctx.db.get(ids[chosen[2]]))!] : [])];
      const team2 = [(await ctx.db.get(ids[chosen[1]]))!, ...(doubles ? [(await ctx.db.get(ids[chosen[3]]))!] : [])];

      await logCompletedMatch(ctx, {
        team1,
        team2,
        createdByUserId: realUser._id,
        sets: randomDemoSets(),
        dateTime: now - Math.floor(Math.random() * DEMO_DAY_WINDOW * DAY),
        place: "Stadtpark",
      });
      for (const name of chosen) counts[name]++;
      matchesCreated++;
    }

    return { realUser: realUser.email, players: DEMO_PLAYER_NAMES, matchesCreated, counts };
  },
});
