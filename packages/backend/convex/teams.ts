import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import type { Doc, Id } from "./_generated/dataModel";
import { currentProfile } from "./users";
import { setsWonByTeam1 } from "./lib/tennis";
import { START_RATING } from "./lib/rating";
import { pairKey } from "./matches";
import { avatarUrl } from "./lib/avatar";

// Team-Lounge unlocks after this many shared doubles (§6.2).
export const TEAM_UNLOCK_AT = 3;

function initials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}
const firstName = (name: string) => name.trim().split(/\s+/)[0];
const rd = (p: Doc<"playerProfiles">) => p.ratingDoubles ?? START_RATING;

// Everything the Team-Lounge screen needs for a partner pair. Team strength is
// computed dynamically as the sum of both ratingDoubles — never stored.
export const forPair = query({
  args: { a: v.id("playerProfiles"), b: v.id("playerProfiles") },
  handler: async (ctx, args) => {
    const pa = await ctx.db.get(args.a);
    const pb = await ctx.db.get(args.b);
    if (!pa || !pb) return null;

    const key = pairKey(args.a, args.b);
    const row = await ctx.db.query("teamPlays").withIndex("by_pairKey", (q) => q.eq("pairKey", key)).unique();
    const sharedCount = row?.matches ?? 0;

    // Shared completed doubles where both players are on the SAME team.
    const doubles = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect())
      .filter(
        (m) =>
          m.type === "doubles" &&
          ((m.team1PlayerIds.includes(args.a) && m.team1PlayerIds.includes(args.b)) ||
            (m.team2PlayerIds.includes(args.a) && m.team2PlayerIds.includes(args.b)))
      )
      .sort((x, y) => y.dateTime - x.dateTime);

    let wins = 0;
    let gamesFor = 0;
    let gamesAgainst = 0;
    const history: { matchId: string; dateTime: number; won: boolean }[] = [];
    for (const m of doubles) {
      const res = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (!res) continue;
      const onT1 = m.team1PlayerIds.includes(args.a);
      const { team1Sets, team2Sets } = setsWonByTeam1(res.sets);
      const won = onT1 ? team1Sets > team2Sets : team2Sets > team1Sets;
      if (won) wins++;
      for (const s of res.sets) {
        gamesFor += onT1 ? s.team1Games : s.team2Games;
        gamesAgainst += onT1 ? s.team2Games : s.team1Games;
      }
      history.push({ matchId: m._id, dateTime: m.dateTime, won });
    }
    const total = history.length;
    let streak = 0;
    for (const h of history) {
      if (h.won) streak++;
      else break;
    }

    return {
      pairKey: key,
      unlocked: sharedCount >= TEAM_UNLOCK_AT,
      unlockAt: TEAM_UNLOCK_AT,
      sharedMatches: sharedCount,
      teamName: row?.teamName ?? `${firstName(pa.displayName)} & ${firstName(pb.displayName)}`,
      hasCustomName: !!row?.teamName,
      teamAvatarUrl: await avatarUrl(ctx, row?.teamAvatarStorageId),
      strength: rd(pa) + rd(pb),
      players: [
        { profileId: pa._id, name: pa.displayName, initials: initials(pa.displayName), avatarUrl: await avatarUrl(ctx, pa.avatarStorageId), rating: rd(pa) },
        { profileId: pb._id, name: pb.displayName, initials: initials(pb.displayName), avatarUrl: await avatarUrl(ctx, pb.avatarStorageId), rating: rd(pb) },
      ],
      wins,
      losses: total - wins,
      pct: total ? Math.round((wins / total) * 100) : 0,
      streak,
      gamesFor,
      gamesAgainst,
    };
  },
});

// Top 3 doubles partners for the signed-in user (profile screen, Doppel toggle):
// shared games + joint win rate, ranked by games played together.
export const topPartners = query({
  args: {},
  handler: async (ctx) => {
    const me = await currentProfile(ctx);
    if (!me) return [];
    const myId = me.profile._id;
    const doubles = (await ctx.db.query("matches").withIndex("by_status", (q) => q.eq("status", "completed")).collect()).filter(
      (m) => m.type === "doubles" && (m.team1PlayerIds.includes(myId) || m.team2PlayerIds.includes(myId))
    );

    const byPartner = new Map<Id<"playerProfiles">, { games: number; wins: number }>();
    for (const m of doubles) {
      const onT1 = m.team1PlayerIds.includes(myId);
      const myTeam = onT1 ? m.team1PlayerIds : m.team2PlayerIds;
      const partnerId = myTeam.find((id) => id !== myId);
      if (!partnerId) continue;
      const res = await ctx.db.query("matchResults").withIndex("by_match", (q) => q.eq("matchId", m._id)).unique();
      if (!res) continue;
      const { team1Sets, team2Sets } = setsWonByTeam1(res.sets);
      const won = onT1 ? team1Sets > team2Sets : team2Sets > team1Sets;
      const agg = byPartner.get(partnerId) ?? { games: 0, wins: 0 };
      agg.games++;
      if (won) agg.wins++;
      byPartner.set(partnerId, agg);
    }

    const ranked = [...byPartner.entries()]
      .sort((a, b) => b[1].games - a[1].games || b[1].wins / b[1].games - a[1].wins / a[1].games)
      .slice(0, 3);

    const out = [];
    for (const [pid, agg] of ranked) {
      const p = await ctx.db.get(pid);
      if (!p || p.isDeleted) continue;
      out.push({
        profileId: p._id,
        name: p.displayName,
        initials: initials(p.displayName),
        avatarUrl: await avatarUrl(ctx, p.avatarStorageId),
        games: agg.games,
        pct: Math.round((agg.wins / agg.games) * 100),
      });
    }
    return out;
  },
});

// Set (or clear) the team name — only once the pair is unlocked.
export const setTeamMeta = mutation({
  args: { a: v.id("playerProfiles"), b: v.id("playerProfiles"), teamName: v.optional(v.string()) },
  handler: async (ctx, args) => {
    const me = await currentProfile(ctx);
    if (!me) throw new Error("Nicht angemeldet.");
    const key = pairKey(args.a, args.b);
    const row = await ctx.db.query("teamPlays").withIndex("by_pairKey", (q) => q.eq("pairKey", key)).unique();
    if (!row || row.matches < TEAM_UNLOCK_AT) throw new Error("Team-Profil erst ab 3 gemeinsamen Doppeln.");
    const name = args.teamName?.trim();
    await ctx.db.patch(row._id, { teamName: name || undefined });
    return { teamName: name || null };
  },
});
