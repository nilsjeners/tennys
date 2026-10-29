import { createClient, type GenericCtx } from "@convex-dev/better-auth";
import { convex, crossDomain } from "@convex-dev/better-auth/plugins";
import { betterAuth } from "better-auth/minimal";
import { expo } from "@better-auth/expo";
import { components } from "./_generated/api";
import { DataModel } from "./_generated/dataModel";
import { query } from "./_generated/server";
import authConfig from "./auth.config";

export const authComponent = createClient<DataModel>(components.betterAuth);

export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth({
    socialProviders: {
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
      apple: {
        clientId: process.env.APPLE_CLIENT_ID!,
        clientSecret: process.env.APPLE_CLIENT_SECRET!,
      },
    },
    // The deployment's .site URL (Convex injects this at runtime). Without it
    // Better Auth can't construct its own origin → auth requests misbehave.
    baseURL: process.env.CONVEX_SITE_URL,
    // "tennys://" = native app scheme. The localhost origins let the Expo web
    // build (npm run web / expo start --web, default port 8081) complete the
    // cross-origin auth handshake in a browser. Add your production web domain
    // here too when you deploy a web build.
    trustedOrigins: [
      "tennys://",
      "http://localhost:8081",
      "http://127.0.0.1:8081",
      "http://localhost:19006",
    ],
    database: authComponent.adapter(ctx),
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },
    // We never verify emails (see above), so requiring local email
    // verification before linking a social account would block every user.
    account: {
      accountLinking: {
        requireLocalEmailVerified: false,
        // Without this, linking Google to an existing password account keeps
        // whatever name/image the account already had (e.g. the email-prefix
        // placeholder name from signup.tsx) instead of adopting Google's.
        updateUserInfoOnLink: true,
      },
    },
    // crossDomain is the SERVER half of the web client's crossDomainClient()
    // (src/lib/auth-client.ts). It sets the Set-Better-Auth-Cookie response
    // header the client listens for to notice a session change; without it,
    // the Convex client's isAuthenticated flag never flips after signing in
    // on web, so the app bounces back to Welcome (login "does nothing").
    plugins: [expo(), crossDomain({ siteUrl: process.env.CONVEX_SITE_URL! }), convex({ authConfig })],
  });
};

export const getCurrentUser = query({
  args: {},
  handler: async (ctx) => {
    return authComponent.getAuthUser(ctx);
  },
});
