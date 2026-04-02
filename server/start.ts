import express from "express";
import path from "node:path";
import { createPresentationsRouter } from "./routes/presentations.js";

export function startServer(presentationsDir: string, port: number): void {
  const app = express();

  app.use(express.text({ type: "text/html", limit: "10mb" }));
  app.use(express.json());

  // Serve built frontend
  const staticDir = path.resolve(import.meta.dirname, "..", "dist");
  app.use(express.static(staticDir));

  // Serve presentation files statically for iframe src
  app.use("/presentations", express.static(presentationsDir));

  // API routes
  app.use("/api/presentations", createPresentationsRouter(presentationsDir));

  // SPA fallback — serve index.html for any unmatched route
  app.get("*", (_req, res) => {
    res.sendFile(path.join(staticDir, "index.html"));
  });

  app.listen(port, () => {
    console.log(`div.deck running at http://localhost:${port}`);
    console.log(`Presentations: ${presentationsDir}`);
  });
}
