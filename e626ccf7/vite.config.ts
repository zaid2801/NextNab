// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - TanStack devtools (dev-only, first), tanstackStart, viteReact, tailwindcss, tsConfigPaths,
//     nitro (build-only using cloudflare as a default target), VITE_* env injection, @ path alias,
//     React/TanStack dedupe, error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... }, etc... }) if needed.
import { resolve } from "node:path";
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { loadEnv, type Plugin } from "vite";

const SERVER_ONLY_KEYS = ["SUPABASE_URL", "SUPABASE_SERVICE_ROLE_KEY", "RESEND_API_KEY"];

/**
 * The bundled config only inlines VITE_* into import.meta.env, so server-only
 * secrets from .env never reach process.env and server functions read them as
 * undefined. Mirror them into process.env here instead of into `define`, which
 * keeps them out of the client bundle and out of the build output.
 */
function serverEnvPlugin(): Plugin {
  return {
    name: "nextnab-server-env",
    config(config, env) {
      // An inherited-but-empty variable would otherwise block the real value.
      const root = config.root ? resolve(config.root) : process.cwd();
      for (const [key, value] of Object.entries(loadEnv(env.mode, root, ""))) {
        if (!process.env[key]) process.env[key] = value;
      }
      const missing = SERVER_ONLY_KEYS.filter((key) => !process.env[key]);
      if (missing.length) {
        console.warn(
          `[nextnab-server-env] ${root}/.env is missing ${missing.join(", ")} — email code login stays disabled.`,
        );
      }
    },
  };
}

export default defineConfig({
  plugins: [serverEnvPlugin()],
  nitro: {
    preset: "vercel",
  },
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    // nitro/vite builds from this
    server: { entry: "server" },
  },
});
