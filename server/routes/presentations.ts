import { Router } from "express";
import fs from "node:fs/promises";
import path from "node:path";

function isValidFilename(name: string): boolean {
  return /^[a-zA-Z0-9_\-. ]+\.html$/.test(name) && !name.includes("..");
}

export function createPresentationsRouter(presentationsDir: string): Router {
  const router = Router();

  // List all .html files
  router.get("/", async (_req, res) => {
    try {
      const entries = await fs.readdir(presentationsDir, {
        withFileTypes: true,
      });
      const files = await Promise.all(
        entries
          .filter((e) => e.isFile() && e.name.endsWith(".html"))
          .map(async (e) => {
            const stat = await fs.stat(path.join(presentationsDir, e.name));
            return {
              name: e.name,
              size: stat.size,
              modified: stat.mtime.toISOString(),
            };
          }),
      );
      files.sort((a, b) => b.modified.localeCompare(a.modified));
      res.json({ files });
    } catch {
      res.status(500).json({ error: "Failed to list presentations" });
    }
  });

  // Read a single presentation
  router.get("/:filename", async (req, res) => {
    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    try {
      const content = await fs.readFile(
        path.join(presentationsDir, filename),
        "utf-8",
      );
      res.type("text/html").send(content);
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  // Write a presentation (atomic, same-directory temp file for cross-filesystem safety)
  router.put("/:filename", async (req, res) => {
    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    try {
      const html = req.body as string;
      const filePath = path.join(presentationsDir, filename);
      const tmpPath = path.join(
        presentationsDir,
        `.tmp-${Date.now()}-${filename}`,
      );
      await fs.writeFile(tmpPath, html, "utf-8");
      await fs.rename(tmpPath, filePath);
      res.json({ ok: true });
    } catch {
      res.status(500).json({ error: "Failed to save presentation" });
    }
  });

  // Delete a presentation
  router.delete("/:filename", async (req, res) => {
    const { filename } = req.params;
    if (!isValidFilename(filename)) {
      return res.status(400).json({ error: "Invalid filename" });
    }
    try {
      await fs.unlink(path.join(presentationsDir, filename));
      res.json({ ok: true });
    } catch {
      res.status(404).json({ error: "File not found" });
    }
  });

  return router;
}
