import { httpRouter } from "convex/server";
import { authComponent, createAuth } from "./auth";

const http = httpRouter();

// `cors: true` makes registerRoutes emit CORS headers + handle OPTIONS
// preflights, using the auth `trustedOrigins` as the allow-list. Required for
// the Expo web build to reach the auth endpoints from a browser origin.
authComponent.registerRoutes(http, createAuth, { cors: true });

export default http;
