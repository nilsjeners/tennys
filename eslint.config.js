// https://docs.expo.dev/guides/using-eslint/
const { defineConfig } = require('eslint/config');
const expoConfig = require("eslint-config-expo/flat");

module.exports = defineConfig([
  expoConfig,
  {
    // apps/admin is a plain Next.js app — the Expo/React Native rules above
    // don't apply there. Give it its own config when it grows real code.
    ignores: ["apps/app/dist/*", "apps/admin/**"],
  }
]);
