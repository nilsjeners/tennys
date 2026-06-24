import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// Derived from docs/tennys-datenmodell-skizze.md.
// Convex provides `_id` and `_creationTime` on every row, so the sketch's
// explicit `id` / `createdAt` fields are intentionally omitted here.

export default defineSchema({
  // Account level: login / auth identity. Tennis identity lives on playerProfiles.
  users: defineTable({
    email: v.string(),
    authProvider: v.union(v.literal("password"), v.literal("apple")),
    roles: v.array(
      v.union(v.literal("player"), v.literal("coach"), v.literal("admin"))
    ),
    authId: v.string(), // links to the Better Auth user (component) subject
  })
    .index("by_email", ["email"])
    .index("by_authId", ["authId"]),

  // Stable tennis identity. Can exist without an owning user (coach-created
  // "private" profile) and later be claimed via QR without losing match history.
  playerProfiles: defineTable({
    displayName: v.string(), // pseudonym allowed
    username: v.optional(v.string()), // @handle shown in profile
    gender: v.string(),
    handedness: v.union(v.literal("left"), v.literal("right")),
    skillLevel: v.optional(
      v.union(v.literal("beginner"), v.literal("intermediate"), v.literal("pro"))
    ),
    city: v.optional(v.string()),
    avatarMediaId: v.optional(v.id("media")),
    clubId: v.optional(v.id("clubs")), // at most one club per MVP
    ownerUserId: v.optional(v.id("users")), // null while unclaimed
    createdByCoachId: v.optional(v.id("users")), // audit, survives claim
    claimToken: v.optional(v.string()), // for QR claim
    claimTokenExpiresAt: v.optional(v.number()),
    currentStrength: v.number(), // cache of latest StrengthSnapshot, starts 1000
  })
    .index("by_owner", ["ownerUserId"])
    .index("by_club", ["clubId"])
    .index("by_claimToken", ["claimToken"]),

  clubs: defineTable({
    name: v.string(),
    description: v.string(),
    location: v.string(), // free text
    logoMediaId: v.optional(v.id("media")),
    ownerCoachId: v.id("users"),
  }).index("by_owner", ["ownerCoachId"]),

  connections: defineTable({
    requesterPlayerProfileId: v.id("playerProfiles"),
    recipientPlayerProfileId: v.id("playerProfiles"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("declined")
    ),
    respondedAt: v.optional(v.number()),
  })
    .index("by_requester", ["requesterPlayerProfileId"])
    .index("by_recipient", ["recipientPlayerProfileId"]),

  // Matches reference PlayerProfile, never User directly.
  matches: defineTable({
    type: v.union(v.literal("singles"), v.literal("doubles")),
    // scheduled = upcoming, live = in progress, completed = logged result.
    status: v.union(v.literal("scheduled"), v.literal("live"), v.literal("completed")),
    dateTime: v.number(),
    scheduledFor: v.optional(v.number()), // upcoming match time (status scheduled)
    place: v.string(), // free text
    clubId: v.optional(v.id("clubs")), // auto-derived
    // Season is a fixed global calendar rule, denormalized from dateTime.
    season: v.union(v.literal("summer"), v.literal("winter")),
    seasonYear: v.number(),
    team1PlayerIds: v.array(v.id("playerProfiles")), // length 1 singles, 2 doubles
    team2PlayerIds: v.array(v.id("playerProfiles")),
    createdByUserId: v.id("users"),
  })
    .index("by_club", ["clubId"])
    .index("by_creator", ["createdByUserId"])
    .index("by_status", ["status"])
    .index("by_season", ["season", "seasonYear"]),

  matchResults: defineTable({
    matchId: v.id("matches"),
    sets: v.array(
      v.object({
        team1Games: v.number(),
        team2Games: v.number(),
        tiebreak: v.optional(
          v.object({
            team1Points: v.number(),
            team2Points: v.number(),
          })
        ),
      })
    ),
    isRetirement: v.boolean(),
    isWalkover: v.boolean(),
    retiredTeam: v.optional(v.union(v.literal(1), v.literal(2))),
    team1TotalGames: v.number(), // denormalized
    team2TotalGames: v.number(), // denormalized
  }).index("by_match", ["matchId"]),

  // One row per (player, match). Full audit trail driving charts and rankings.
  strengthSnapshots: defineTable({
    playerProfileId: v.id("playerProfiles"),
    matchId: v.id("matches"),
    strengthBefore: v.number(),
    strengthAfter: v.number(),
    delta: v.number(),
    season: v.union(v.literal("summer"), v.literal("winter")), // denormalized
    seasonYear: v.number(),
  })
    .index("by_player", ["playerProfileId"])
    .index("by_match", ["matchId"])
    .index("by_player_season", ["playerProfileId", "season", "seasonYear"]),

  posts: defineTable({
    matchId: v.id("matches"), // 0 or 1 post per match
    authorUserId: v.id("users"),
    caption: v.optional(v.string()),
  }).index("by_match", ["matchId"]),

  // Media attaches only to Post, never to Comment.
  media: defineTable({
    postId: v.id("posts"),
    storageId: v.optional(v.id("_storage")),
    url: v.optional(v.string()),
    order: v.number(),
  }).index("by_post", ["postId"]),

  // Comments hang on the match (the match detail page has a thread even without a post).
  comments: defineTable({
    matchId: v.id("matches"),
    authorUserId: v.id("users"),
    text: v.string(),
  }).index("by_match", ["matchId"]),

  // One row per (matchId, userId); re-reacting changes the type, never adds a row.
  reactions: defineTable({
    matchId: v.id("matches"),
    userId: v.id("users"),
    type: v.union(
      v.literal("like"),
      v.literal("tennis_ball"),
      v.literal("fire"),
      v.literal("strong")
    ),
  })
    .index("by_match", ["matchId"])
    .index("by_match_user", ["matchId", "userId"]),

  // Stored entity with read status and history, not computed on the fly.
  notifications: defineTable({
    recipientUserId: v.id("users"),
    type: v.union(
      v.literal("friend_request"),
      v.literal("friend_accepted"),
      v.literal("comment"),
      v.literal("reaction")
    ),
    payload: v.object({
      fromUserId: v.optional(v.id("users")),
      matchId: v.optional(v.id("matches")),
      connectionId: v.optional(v.id("connections")),
    }),
    isRead: v.boolean(),
  }).index("by_recipient", ["recipientUserId", "isRead"]),
});
