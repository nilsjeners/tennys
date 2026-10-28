/* eslint-disable */
/**
 * Generated `api` utility.
 *
 * THIS CODE IS AUTOMATICALLY GENERATED.
 *
 * To regenerate, run `npx convex dev`.
 * @module
 */

import type * as admin from "../admin.js";
import type * as auth from "../auth.js";
import type * as comments from "../comments.js";
import type * as files from "../files.js";
import type * as friends from "../friends.js";
import type * as http from "../http.js";
import type * as i18n from "../i18n.js";
import type * as lib_activity from "../lib/activity.js";
import type * as lib_avatar from "../lib/avatar.js";
import type * as lib_locales from "../lib/locales.js";
import type * as lib_rating from "../lib/rating.js";
import type * as lib_tennis from "../lib/tennis.js";
import type * as matches from "../matches.js";
import type * as migrations from "../migrations.js";
import type * as notifications from "../notifications.js";
import type * as players from "../players.js";
import type * as reactions from "../reactions.js";
import type * as seed from "../seed.js";
import type * as stats from "../stats.js";
import type * as teams from "../teams.js";
import type * as users from "../users.js";

import type {
  ApiFromModules,
  FilterApi,
  FunctionReference,
} from "convex/server";

declare const fullApi: ApiFromModules<{
  admin: typeof admin;
  auth: typeof auth;
  comments: typeof comments;
  files: typeof files;
  friends: typeof friends;
  http: typeof http;
  i18n: typeof i18n;
  "lib/activity": typeof lib_activity;
  "lib/avatar": typeof lib_avatar;
  "lib/locales": typeof lib_locales;
  "lib/rating": typeof lib_rating;
  "lib/tennis": typeof lib_tennis;
  matches: typeof matches;
  migrations: typeof migrations;
  notifications: typeof notifications;
  players: typeof players;
  reactions: typeof reactions;
  seed: typeof seed;
  stats: typeof stats;
  teams: typeof teams;
  users: typeof users;
}>;

/**
 * A utility for referencing Convex functions in your app's public API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = api.myModule.myFunction;
 * ```
 */
export declare const api: FilterApi<
  typeof fullApi,
  FunctionReference<any, "public">
>;

/**
 * A utility for referencing Convex functions in your app's internal API.
 *
 * Usage:
 * ```js
 * const myFunctionReference = internal.myModule.myFunction;
 * ```
 */
export declare const internal: FilterApi<
  typeof fullApi,
  FunctionReference<any, "internal">
>;

export declare const components: {
  betterAuth: import("@convex-dev/better-auth/_generated/component.js").ComponentApi<"betterAuth">;
};
