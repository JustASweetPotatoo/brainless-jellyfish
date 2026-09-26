import { dirname } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import { mockApiPlugin } from "./vite.mockApi.ts";

const configDirectory = dirname(fileURLToPath(import.meta.url));

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, configDirectory, "");

  return {
    plugins: [
      react(),
      tailwindcss(),
      mockApiPlugin({
        discordClientId: env.DISCORD_CLIENT_ID,
        discordClientSecret: env.DISCORD_CLIENT_SECRET,
        discordRedirectUri: env.DISCORD_REDIRECT_URI,
        webOrigin: env.WEB_ORIGIN,
        secureCookie: env.DISCORD_OAUTH_COOKIE_SECURE === "true",
      }),
    ],
  };
});
