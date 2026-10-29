/** @type {import('next').NextConfig} */
const nextConfig = {
  // @repo/backend ships raw TS (legal copy lives in convex/lib/locales.ts).
  transpilePackages: ["@repo/backend"],
};

module.exports = nextConfig;
