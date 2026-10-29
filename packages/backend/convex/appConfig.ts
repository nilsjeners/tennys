import { query } from "./_generated/server";

// Lowest native app version (app.json `version`) still allowed to run.
// Public on purpose: the app checks it before sign-in. Set per deployment:
//   npx convex env set MIN_APP_VERSION 1.2.0
// Unset = every version is allowed.
export const minSupportedVersion = query({
  args: {},
  handler: async () => process.env.MIN_APP_VERSION ?? null,
});
