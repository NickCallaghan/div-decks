import { defineConfig, configDefaults } from "vitest/config";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "node:path";
import fs from "node:fs";

/**
 * Vite plugin that watches presentations/*.html separately from Vite's
 * own watcher. Sends custom HMR events so the client can re-fetch data
 * seamlessly instead of triggering a full page reload.
 *
 * Vite's watcher is told to ignore presentations/ (see server.watch.ignored).
 */
function presentationHmr() {
  const presentationsDir = path.resolve(__dirname, "presentations");
  return {
    name: "presentation-hmr",
    apply: "serve",
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    configureServer(server: any) {
      // Don't start the file watcher during test runs
      if (process.env.VITEST) return;
      const watcher = fs.watch(presentationsDir, (_event, filename) => {
        if (filename && filename.endsWith(".html")) {
          server.ws.send({
            type: "custom",
            event: "presentation-changed",
            data: { filename },
          });
        }
      });
      server.httpServer?.on("close", () => watcher.close());
    },
  };
}

export default defineConfig({
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  plugins: [react(), tailwindcss(), presentationHmr() as any],
  server: {
    watch: {
      ignored: ["**/presentations/**"],
    },
    proxy: {
      "/api": {
        target: "http://localhost:3001",
        changeOrigin: true,
      },
    },
  },
  test: {
    environment: "jsdom",
    globals: true,
    exclude: [...configDefaults.exclude, "**/e2e/**", "**/dist-server/**"],
  },
});
