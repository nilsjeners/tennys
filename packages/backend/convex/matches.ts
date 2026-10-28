import { v } from "convex/values";
import { paginationOptsValidator } from "convex/server";
import { mutation, query, type MutationCtx, type QueryCtx } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { seasonForDate, setsWonByTeam1, windowLast30Days } from "./lib/tennis";
import { calcSingles, calcDoubles, totalGames, START_RATING } from "./lib/rating";
import { avatarUrl } from "./lib/avatar";
import { DEFAULT_LOCALE, LOCALES, type LocaleCode } from "./lib/locales";
import { pushNotification } from "./notifications";
import { acceptedFriendIds } from "./friends";

type Discipline = "singles" | "doubles";
const disciplineArg = v.optional(v.union(v.literal("singles"), v.literal("doubles")));

const disciplineOf = (type: "singles" | "doubles"): Discipline => (type === "doubles" ? "doubles" : "singles");
const ratingOf = (p: Doc<"playerProfiles">, d: Discipline): number =>
  (d === "singles" ? p.ratingSingles : p.ratingDoubles) ?? START_RATING;

// Order-independent key for a partner pair (Team-Lounge).
export function pairKey(a: Id<"playerProfiles">, b: Id<"playerProfiles">): string {
  return [a as string, b as string].sort().join("_");
}

// A player is "new" in a discipline until they have a completed match of it.
async function isNewInDiscipline(ctx: MutationCtx, pid: Id<"playerProfiles">, d: Discipline): Promise<boolean> {
  const prior = await ctx.db
    .query("strengthSnapshots")
    .withIndex("by_player_discipline", (q) => q.eq("playerProfileId", pid).eq("discipline", d))
    .first();
  return prior === null;
}

async function writeSnapshot(
  ctx: MutationCtx,
  playerId: Id<"playerProfiles">,
  before: number,
  after: number,
  discipline: Discipline,
  matchId: Id<"matches">,
  season: "summer" | "winter",
  seasonYear: number
) {
  await ctx.db.insert("strengthSnapshots", {
    playerProfileId: playerId,
    matchId,
    discipline,
    strengthBefore: before,
    strengthAfter: after,
    delta: after - before,
    season,
    seasonYear,
  });
  await ctx.db.patch(playerId, discipline === "singles" ? { ratingSingles: after } : { ratingDoubles: after });
}

async function bumpTeamPlays(ctx: MutationCtx, a: Id<"playerProfiles">, b: Id<"playerProfiles">) {
  const key = pairKey(a, b);
  const row = await ctx.db.query("teamPlays").withIndex("by_pairKey", (q) => q.eq("pairKey", key)).unique();
  if (row) await ctx.db.patch(row._id, { matches: row.matches + 1 });
  else await ctx.db.insert("teamPlays", { pairKey: key, profileA: a, profileB: b, matches: 1 });
}

async function decrementTeamPlays(ctx: MutationCtx, a: Id<"playerProfiles">, b: Id<"playerProfiles">) {
  const key = pairKey(a, b);
  const row = await ctx.db.query("teamPlays").withIndex("by_pairKey", (q) => q.eq("pairKey", key)).unique();
  if (!row) return;
  const next = row.matches - 1;
  if (next <= 0 && !row.teamName && !row.teamAvatarStorageId) await ctx.db.delete(row._id);
  else await ctx.db.patch(row._id, { matches: Math.max(0, next) });
}

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const firstName = (name: string) => name.trim().split(/\s+/)[0];
function sideLabel(names: string[]): string {
  if (names.length <= 1) {
    const n = names[0] ?? "";
    const parts = n.trim().split(/\s+/);
    return parts.length < 2 ? n : `${parts[0]} ${parts[parts.length - 1][0]}.`;
  }
  return names.map(firstName).join(" & ");
}

// Display name for a profile in the viewer's language. Deleted accounts keep
// their row (so match history still renders) but are shown anonymised, and a
// missing row degrades to "unknown" instead of blank. These two are system
// placeholders, so they resolve from the bundled strings rather than the
// editable `translations` table — no per-query table read on a hot path.
function displayNameFor(p: Doc<"playerProfiles"> | null, locale: LocaleCode): string {
  if (!p) return LOCALES[locale]["common.unknownPlayer"];
  if (p.isDeleted) return LOCALES[locale]["common.deletedPlayer"];
  return p.displayName;
}

// The signed-in viewer's language; drives every server-rendered name above.
function localeOf(me: { user: Doc<"users"> } | null): LocaleCode {
  return me?.user.language ?? DEFAULT_LOCALE;
}

// A player entry for a match card / detail row.
async function cardPlayer(ctx: QueryCtx | MutationCtx, id: Id<"playerProfiles">, locale: LocaleCode) {
  const p = await ctx.db.get(id);
  const name = displayNameFor(p, locale);
  return {
    profileId: id,
    name,
    initials: p ? initials(name) : "?",
    avatarUrl: await avatarUrl(ctx, p?.avatarStorageId),
  };
}

async function reactionCount(ctx: QueryCtx, matchId: Id<"matches">) {
  return (await ctx.db.query("reactions").withIndex("by_match", (q) => q.eq("matchId", matchId)).collect()).length;
}
async function commentCount(ctx: QueryCtx, matchId: Id<"matches">) {
  return (await ctx.db.query("comments").withIndex("by_match", (q) => q.eq("matchId", matchId)).collect()).length;
}

// A match rendered as a two-row card. sideA = team1, sideB = team2, always —
// fixed by creation order, never swapped by viewer, so every participant
// (and every screen) sees the exact same "A vs B" arrangement.
async function matchCard(ctx: QueryCtx, match: Doc<"matches">, locale: LocaleCode) {
  const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", match._id)).unique();
  const rawSets = result?.sets ?? [];
  const team1Scores = rawSets.map((s) => s.team1Games);
  const team2Scores = rawSets.map((s) => s.team2Games);
  const { team1Sets, team2Sets } = setsWonByTeam1(rawSets);

  const team1Players = await Promise.all(match.team1PlayerIds.map((id) => cardPlayer(ctx, id, locale)));
  const team2Players = await Promise.all(match.team2PlayerIds.map((id) => cardPlayer(ctx, id, locale)));

  return {
    matchId: match._id,
    dateTime: match.dateTime,
    type: match.type,
    sideA: { players: team1Players, name: sideLabel(team1Players.map((p) => p.name)), scores: team1Scores, won: rawSets.length > 0 && team1Sets > team2Sets },
    sideB: { players: team2Players, name: sideLabel(team2Players.map((p) => p.name)), scores: team2Scores, won: rawSets.length > 0 && team2Sets > team1Sets },
    likes: await reactionCount(ctx, match._id),
    comments: await commentCount(ctx, match._id),
  };
}

// Home screen feed: next scheduled, live, recent completed.
export const home = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return null;
    const myId = me.profile._id;

    const mine = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect()).filter(
      (m) => m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)
    );

    const completed = mine.filter((m) => m.status === "completed").sort((a, b) => b.dateTime - a.dateTime);
    const recent = await Promise.all(completed.slice(0, 10).map((m) => matchCard(ctx, m, localeOf(me))));

    // Any live match I'm part of, not just ones I created — an opponent's
    // in-progress score should show up here too, live.
    const liveMatch = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "live")).collect()).find(
      (m) => m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)
    );
    let live = null;
    if (liveMatch) {
      const c = await matchCard(ctx, liveMatch, localeOf(me));
      live = {
        startedAt: c.dateTime,
        sideA: { name: c.sideA.name, initials: c.sideA.players[0].initials, avatarUrl: c.sideA.players[0].avatarUrl, scores: c.sideA.scores },
        sideB: { name: c.sideB.name, initials: c.sideB.players[0].initials, avatarUrl: c.sideB.players[0].avatarUrl, scores: c.sideB.scores },
      };
    }

    return { live, recent };
  },
});

// Longer completed history (profile screen).
export const history = query({
  args: { limit: v.optional(v.number()), discipline: disciplineArg },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const myId = me.profile._id;
    const mine = (await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect())
      .filter((m) => m.status === "completed" && (!args.discipline || m.type === args.discipline) && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId)))
      .sort((a, b) => b.dateTime - a.dateTime)
      .slice(0, args.limit ?? 10);
    return Promise.all(mine.map((m) => matchCard(ctx, m, localeOf(me))));
  },
});

// Same as `history`, but for an arbitrary player's public profile — over ALL
// their completed matches (not creator-filtered, since the viewer may not be
// the match owner).
export const historyForPlayer = query({
  args: { profileId: v.id("playerProfiles"), limit: v.optional(v.number()), discipline: disciplineArg },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    const pid = args.profileId;
    const theirs = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
      .filter((m) => (!args.discipline || m.type === args.discipline) && (m.team1PlayerIds.includes(pid) || m.team2PlayerIds.includes(pid)))
      .sort((a, b) => b.dateTime - a.dateTime)
      .slice(0, args.limit ?? 10);
    return Promise.all(theirs.map((m) => matchCard(ctx, m, localeOf(me))));
  },
});

// Paginated completed-match feed (10er-Blöcke via usePaginatedQuery): mine and
// my friends', newest first by match dateTime. Live pinning stays in `home`.
export const feed = query({
  args: { paginationOpts: paginationOptsValidator, discipline: disciplineArg },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return { page: [], isDone: true, continueCursor: "" };
    const myId = me.profile._id;
    const allowed = new Set([myId, ...(await acceptedFriendIds(ctx, myId))]);

    const all = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
      .filter((m) => m.team1PlayerIds.some((id) => allowed.has(id)) || m.team2PlayerIds.some((id) => allowed.has(id)))
      .filter((m) => !args.discipline || m.type === args.discipline)
      .sort((a, b) => b.dateTime - a.dateTime);

    const start = args.paginationOpts.cursor ? Number(args.paginationOpts.cursor) : 0;
    const slice = all.slice(start, start + args.paginationOpts.numItems);
    const nextCursor = start + slice.length;
    const page = await Promise.all(slice.map((m) => matchCard(ctx, m, localeOf(me))));
    return { page, isDone: nextCursor >= all.length, continueCursor: String(nextCursor) };
  },
});

// True when this match is the most recent one OF ITS DISCIPLINE for every
// participant — the locked precondition for deletion. Shared by detail + remove.
async function isLatestForAll(ctx: QueryCtx | MutationCtx, match: Doc<"matches">): Promise<boolean> {
  const discipline = disciplineOf(match.type);
  for (const pid of [...match.team1PlayerIds, ...match.team2PlayerIds]) {
    const latest = (
      await ctx.db.query("strengthSnapshots").withIndex("by_player_discipline", (q) => q.eq("playerProfileId", pid).eq("discipline", discipline)).collect()
    ).sort((a, b) => b._creationTime - a._creationTime)[0];
    if (latest && latest.matchId !== match._id) return false;
  }
  return true;
}

// Full match detail: both sides with per-player strength change, reaction + comment
// counts, and a strength/balance breakdown for the collapsible statistics panel.
export const detail = query({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    const match = await ctx.db.get(args.matchId);
    if (!match) return null;
    const myId = me?.profile._id;

    const discipline = disciplineOf(match.type);
    const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", match._id)).unique();
    const rawSets = result?.sets ?? [];
    const { team1Sets, team2Sets } = setsWonByTeam1(rawSets);

    const snapshotFor = async (pid: Id<"playerProfiles">) =>
      ctx.db.query("strengthSnapshots").withIndex("by_match", (q) => q.eq("matchId", match._id)).collect().then((rows) => rows.find((r) => r.playerProfileId === pid) ?? null);

    const sidePlayer = async (pid: Id<"playerProfiles">) => {
      const base = await cardPlayer(ctx, pid, localeOf(me));
      const p = await ctx.db.get(pid);
      const snap = await snapshotFor(pid);
      const current = p ? ratingOf(p, discipline) : snap?.strengthAfter ?? START_RATING;
      const delta = snap?.delta ?? 0;
      const before = snap?.strengthBefore ?? current;
      // PRD: rating change shown as a relative percentage pill (e.g. +1.9%)
      const pctDelta = before > 0 ? Math.round((delta / before) * 1000) / 10 : 0;
      return { ...base, isMe: pid === myId, delta, before, pctDelta, current };
    };

    const side = async (ids: Id<"playerProfiles">[], team1: boolean) => {
      const players = await Promise.all(ids.map(sidePlayer));
      const scores = rawSets.map((s) => (team1 ? s.team1Games : s.team2Games));
      const won = rawSets.length > 0 && (team1 ? team1Sets > team2Sets : team2Sets > team1Sets);
      return { players, name: sideLabel(players.map((p) => p.name)), scores, won };
    };

    // Statistics: strength series (30-day window) + win/loss per participant.
    const partIds = [...match.team1PlayerIds, ...match.team2PlayerIds];
    const stats = await Promise.all(
      partIds.map(async (pid) => {
        const p = await ctx.db.get(pid);
        // chronological order (not row-insertion order — matches can be logged out of order)
        const snaps = await ctx.db.query("strengthSnapshots").withIndex("by_player_discipline", (q) => q.eq("playerProfileId", pid).eq("discipline", discipline)).collect();
        const withDates = await Promise.all(snaps.map(async (s) => {
          const snapMatch = await ctx.db.get(s.matchId);
          return { value: s.strengthAfter, dateTime: snapMatch?.dateTime ?? s._creationTime, matchId: s.matchId };
        }));
        withDates.sort((a, b) => a.dateTime - b.dateTime);
        const series = windowLast30Days(withDates);
        // wins/losses from completed matches of THIS discipline involving the player
        let wins = 0, total = 0;
        const played = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect()).filter(
          (m) => m.type === match.type && (m.team1PlayerIds.includes(pid) || m.team2PlayerIds.includes(pid))
        );
        for (const m of played) {
          const r = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
          if (!r) continue;
          const { team1Sets: t1, team2Sets: t2 } = setsWonByTeam1(r.sets);
          const onT1 = m.team1PlayerIds.includes(pid);
          total++;
          if (onT1 ? t1 > t2 : t2 > t1) wins++;
        }
        return {
          profileId: pid,
          name: displayNameFor(p, localeOf(me)),
          series: series.length ? series : [{ value: p ? ratingOf(p, discipline) : START_RATING, dateTime: match.dateTime, matchId: match._id }],
          wins,
          losses: total - wins,
        };
      })
    );

    const myReaction = me
      ? await ctx.db.query("reactions").withIndex("by_match_user", (q) => q.eq("matchId", match._id).eq("userId", me.user._id)).unique()
      : null;

    return {
      matchId: match._id,
      type: match.type,
      dateTime: match.dateTime,
      // PRD: delete only offered when this really is every participant's most
      // recent match (of this discipline) — mirrors the remove() precondition.
      canDelete: !!me && match.status === "completed" && match.createdByUserId === me.user._id && (await isLatestForAll(ctx, match)),
      // side A = team1, side B = team2, always — same arrangement for every viewer.
      sideA: await side(match.team1PlayerIds, true),
      sideB: await side(match.team2PlayerIds, false),
      reactions: { total: await reactionCount(ctx, match._id), mine: myReaction?.type ?? null },
      comments: await commentCount(ctx, match._id),
      stats,
    };
  },
});

// Start a live match: creates the row immediately (status "live", no result
// yet) so it can be pinned on Home as soon as score entry begins. At most one
// live match per creator — a stale one (app killed mid-entry) is cleared first.
export const startLive = mutation({
  args: {
    team1ProfileIds: v.array(v.id("playerProfiles")),
    team2ProfileIds: v.array(v.id("playerProfiles")),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Kein Profil — bitte zuerst anmelden.");
    if (args.team1ProfileIds.length === 0 || args.team2ProfileIds.length === 0) throw new Error("Beide Seiten brauchen Spieler.");

    const team1 = await Promise.all(args.team1ProfileIds.map((id) => ctx.db.get(id)));
    const team2 = await Promise.all(args.team2ProfileIds.map((id) => ctx.db.get(id)));
    if (team1.some((p) => !p) || team2.some((p) => !p)) throw new Error("Spieler nicht gefunden.");

    const stale = await ctx.db.query("matches").withIndex("by_creator", (q) => q.eq("createdByUserId", me.user._id)).collect();
    for (const m of stale) {
      if (m.status !== "live") continue;
      const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (result) await ctx.db.delete(result._id);
      await ctx.db.delete(m._id);
    }

    const dateTime = Date.now();
    const { season, seasonYear } = seasonForDate(dateTime);
    const matchId = await ctx.db.insert("matches", {
      type: args.team1ProfileIds.length > 1 || args.team2ProfileIds.length > 1 ? "doubles" : "singles",
      status: "live",
      dateTime,
      place: "",
      clubId: (team1[0] as Doc<"playerProfiles">).clubId,
      season,
      seasonYear,
      team1PlayerIds: args.team1ProfileIds,
      team2PlayerIds: args.team2ProfileIds,
      createdByUserId: me.user._id,
    });

    for (const p of [...team1, ...team2] as Doc<"playerProfiles">[]) {
      if (p.ownerUserId) {
        await pushNotification(ctx, { recipientUserId: p.ownerUserId, actorUserId: me.user._id, type: "live_started", matchId });
      }
    }

    return matchId;
  },
});

// Live score sync while entering a match: upserts the (partial) result so
// every other participant sees the running score in real time via `home`.
// Creator-only — they're the one holding the entry screen.
export const updateLiveScore = mutation({
  args: {
    matchId: v.id("matches"),
    sets: v.array(v.object({ team1Games: v.number(), team2Games: v.number() })),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return;
    const match = await ctx.db.get(args.matchId);
    if (!match || match.status !== "live" || match.createdByUserId !== me.user._id) return;

    const { gamesTeam1, gamesTeam2 } = totalGames(args.sets);
    const existing = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", args.matchId)).unique();
    if (existing) {
      await ctx.db.patch(existing._id, { sets: args.sets, team1TotalGames: gamesTeam1, team2TotalGames: gamesTeam2 });
    } else {
      await ctx.db.insert("matchResults", {
        matchId: args.matchId,
        sets: args.sets,
        isRetirement: false,
        isWalkover: false,
        team1TotalGames: gamesTeam1,
        team2TotalGames: gamesTeam2,
      });
    }
  },
});

// Abandon a live match (back-navigation out of score entry) — notifies every
// other participant it was cancelled without a result, then deletes it and
// any partial score `updateLiveScore` wrote; no snapshots exist yet to roll
// back. No matchId in the notification payload — the match won't exist to
// link to. (`notifications.list` also drops the link on the earlier
// `live_started` notification once it sees the match is gone.)
export const cancelLive = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) return;
    const match = await ctx.db.get(args.matchId);
    if (!match || match.status !== "live" || match.createdByUserId !== me.user._id) return;

    for (const pid of [...match.team1PlayerIds, ...match.team2PlayerIds]) {
      const p = await ctx.db.get(pid);
      if (p?.ownerUserId) {
        await pushNotification(ctx, { recipientUserId: p.ownerUserId, actorUserId: me.user._id, type: "live_cancelled" });
      }
    }

    const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", args.matchId)).unique();
    if (result) await ctx.db.delete(result._id);
    await ctx.db.delete(match._id);
  },
});

// Finish a live match: writes the result + strength snapshots and flips it to
// completed. Notifies every participant, then any friends of participants who
// didn't play themselves.
export const finishLive = mutation({
  args: {
    matchId: v.id("matches"),
    sets: v.array(v.object({ team1Games: v.number(), team2Games: v.number() })),
  },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    if (args.sets.length === 0) throw new Error("Mindestens ein Satz erforderlich.");
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Spiel nicht gefunden.");
    if (match.status !== "live") throw new Error("Spiel ist nicht live.");
    if (match.createdByUserId !== me.user._id) throw new Error("Nur der Ersteller kann das Spiel beenden.");

    const team1 = (await Promise.all(match.team1PlayerIds.map((id) => ctx.db.get(id)))) as Doc<"playerProfiles">[];
    const team2 = (await Promise.all(match.team2PlayerIds.map((id) => ctx.db.get(id)))) as Doc<"playerProfiles">[];

    await ctx.db.patch(match._id, { status: "completed" });
    await writeMatchResultAndSnapshots(ctx, {
      matchId: match._id,
      team1,
      team2,
      sets: args.sets,
      type: match.type,
      season: match.season,
      seasonYear: match.seasonYear,
    });

    const notified = new Set<Id<"users">>();
    for (const p of [...team1, ...team2]) {
      if (p.ownerUserId && !notified.has(p.ownerUserId)) {
        notified.add(p.ownerUserId);
        await pushNotification(ctx, { recipientUserId: p.ownerUserId, actorUserId: me.user._id, type: "match_result", matchId: match._id });
      }
    }
    await notifyFriendsOfNewMatch(ctx, {
      matchId: match._id,
      participantIds: [...match.team1PlayerIds, ...match.team2PlayerIds],
      actorUserId: me.user._id,
      exclude: notified,
    });

    return match._id;
  },
});

// Friends of any participant who didn't play themselves — one notification
// each, regardless of how many participants they're friends with.
async function notifyFriendsOfNewMatch(
  ctx: MutationCtx,
  args: { matchId: Id<"matches">; participantIds: Id<"playerProfiles">[]; actorUserId: Id<"users">; exclude: Set<Id<"users">> }
) {
  const participantSet = new Set(args.participantIds);
  const notified = new Set(args.exclude);
  for (const pid of args.participantIds) {
    for (const friendId of await acceptedFriendIds(ctx, pid)) {
      if (participantSet.has(friendId)) continue;
      const friend = await ctx.db.get(friendId);
      if (!friend?.ownerUserId || notified.has(friend.ownerUserId)) continue;
      notified.add(friend.ownerUserId);
      await pushNotification(ctx, { recipientUserId: friend.ownerUserId, actorUserId: args.actorUserId, type: "new_match", matchId: args.matchId });
    }
  }
}

// Shared logger for a completed match — result + strength snapshots for every
// participant. team1 = "my" side. Keeps the locked snapshot rules in one place.
export async function logCompletedMatch(
  ctx: MutationCtx,
  args: {
    team1: Doc<"playerProfiles">[];
    team2: Doc<"playerProfiles">[];
    createdByUserId: Id<"users">;
    sets: { team1Games: number; team2Games: number }[];
    dateTime: number;
    place?: string;
  }
): Promise<Id<"matches">> {
  const { team1, team2, sets, dateTime } = args;
  if (sets.length === 0) throw new Error("Mindestens ein Satz erforderlich.");
  const { season, seasonYear } = seasonForDate(dateTime);
  const type = team1.length > 1 || team2.length > 1 ? "doubles" : "singles";

  const matchId = await ctx.db.insert("matches", {
    type,
    status: "completed",
    dateTime,
    place: args.place ?? "",
    clubId: team1[0].clubId,
    season,
    seasonYear,
    team1PlayerIds: team1.map((p) => p._id),
    team2PlayerIds: team2.map((p) => p._id),
    createdByUserId: args.createdByUserId,
  });

  await writeMatchResultAndSnapshots(ctx, { matchId, team1, team2, sets, type, season, seasonYear });

  return matchId;
}

// Result row + per-player TPRS snapshots for an already-created match.
async function writeMatchResultAndSnapshots(
  ctx: MutationCtx,
  args: {
    matchId: Id<"matches">;
    team1: Doc<"playerProfiles">[];
    team2: Doc<"playerProfiles">[];
    sets: { team1Games: number; team2Games: number }[];
    type: "singles" | "doubles";
    season: "summer" | "winter";
    seasonYear: number;
  }
) {
  const { matchId, team1, team2, sets, type, season, seasonYear } = args;
  const { gamesTeam1, gamesTeam2 } = totalGames(sets);
  // A live match may already have a partial row from updateLiveScore — patch
  // it rather than inserting a second one.
  const existing = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", matchId)).unique();
  const resultFields = { sets, isRetirement: false, isWalkover: false, team1TotalGames: gamesTeam1, team2TotalGames: gamesTeam2 };
  if (existing) await ctx.db.patch(existing._id, resultFields);
  else await ctx.db.insert("matchResults", { matchId, ...resultFields });

  const discipline = disciplineOf(type);

  // Determine "new" status BEFORE writing any snapshot for this match.
  const newFlags = new Map<string, boolean>();
  for (const p of [...team1, ...team2]) newFlags.set(p._id, await isNewInDiscipline(ctx, p._id, discipline));
  const isNew = (p: Doc<"playerProfiles">) => newFlags.get(p._id)!;

  if (discipline === "singles") {
    const A = team1[0];
    const B = team2[0];
    const rA = ratingOf(A, "singles");
    const rB = ratingOf(B, "singles");
    const res = calcSingles(rA, rB, gamesTeam1, gamesTeam2, isNew(A), isNew(B));
    await writeSnapshot(ctx, A._id, rA, res.ratingA, "singles", matchId, season, seasonYear);
    await writeSnapshot(ctx, B._id, rB, res.ratingB, "singles", matchId, season, seasonYear);
  } else {
    const [a1, a2] = team1;
    const [b1, b2] = team2;
    const rA1 = ratingOf(a1, "doubles");
    const rA2 = ratingOf(a2, "doubles");
    const rB1 = ratingOf(b1, "doubles");
    const rB2 = ratingOf(b2, "doubles");
    const res = calcDoubles(
      { rating: rA1, isNew: isNew(a1) },
      { rating: rA2, isNew: isNew(a2) },
      { rating: rB1, isNew: isNew(b1) },
      { rating: rB2, isNew: isNew(b2) },
      gamesTeam1,
      gamesTeam2
    );
    await writeSnapshot(ctx, a1._id, rA1, res.a1, "doubles", matchId, season, seasonYear);
    await writeSnapshot(ctx, a2._id, rA2, res.a2, "doubles", matchId, season, seasonYear);
    await writeSnapshot(ctx, b1._id, rB1, res.b1, "doubles", matchId, season, seasonYear);
    await writeSnapshot(ctx, b2._id, rB2, res.b2, "doubles", matchId, season, seasonYear);
    await bumpTeamPlays(ctx, a1._id, a2._id);
    await bumpTeamPlays(ctx, b1._id, b2._id);
  }
}

// Delete a match — only if it is the most recent match for ALL participants.
// Also deletes its result, snapshots, comments, reactions; resets each player's
// discipline rating to the prior snapshot's value (or 1000). (Locked product rule.)
export const remove = mutation({
  args: { matchId: v.id("matches") },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const match = await ctx.db.get(args.matchId);
    if (!match) throw new Error("Spiel nicht gefunden.");
    if (match.createdByUserId !== me.user._id) throw new Error("Nur der Ersteller kann löschen.");

    const discipline = disciplineOf(match.type);
    const participants = [...match.team1PlayerIds, ...match.team2PlayerIds];

    // Deletable only if this is each participant's most recent match OF THIS
    // discipline (a later match of the other discipline is independent).
    if (!(await isLatestForAll(ctx, match))) {
      throw new Error("Nur das jeweils letzte Spiel aller Beteiligten ist löschbar.");
    }

    // Revert this discipline's rating to the prior same-discipline snapshot, then delete rows.
    for (const pid of participants) {
      const snaps = (await ctx.db.query("strengthSnapshots").withIndex("by_player_discipline", (q) => q.eq("playerProfileId", pid).eq("discipline", discipline)).collect())
        .sort((a, b) => b._creationTime - a._creationTime);
      const thisSnap = snaps.find((s) => s.matchId === match._id);
      const prior = snaps.find((s) => s.matchId !== match._id);
      const revert = prior ? prior.strengthAfter : START_RATING;
      await ctx.db.patch(pid, discipline === "singles" ? { ratingSingles: revert } : { ratingDoubles: revert });
      if (thisSnap) await ctx.db.delete(thisSnap._id);
    }

    if (discipline === "doubles") {
      await decrementTeamPlays(ctx, match.team1PlayerIds[0], match.team1PlayerIds[1]);
      await decrementTeamPlays(ctx, match.team2PlayerIds[0], match.team2PlayerIds[1]);
    }

    const result = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", match._id)).unique();
    if (result) await ctx.db.delete(result._id);
    for (const c of await ctx.db.query("comments").withIndex("by_match", (q) => q.eq("matchId", match._id)).collect()) await ctx.db.delete(c._id);
    for (const r of await ctx.db.query("reactions").withIndex("by_match", (q) => q.eq("matchId", match._id)).collect()) await ctx.db.delete(r._id);
    await ctx.db.delete(match._id);
    return { deleted: true };
  },
});
