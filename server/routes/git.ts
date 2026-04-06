import { Router } from "express";
import path from "node:path";
import {
  isGitRepo,
  getRepoRoot,
  getCurrentBranch,
  getFileStatus,
} from "../lib/git.js";

function isValidFilename(name: string): boolean {
  return /^[a-zA-Z0-9_\-. ]+\.html$/.test(name) && !name.includes("..");
}

export function createGitRouter(presentationsDir: string): Router {
  const router = Router();

  // Cache git availability and repo root after first check
  let gitAvailable: boolean | null = null;
  let repoRoot: string | null = null;

  async function ensureGitInfo(): Promise<boolean> {
    if (gitAvailable === null) {
      gitAvailable = await isGitRepo(presentationsDir);
      if (gitAvailable) {
        repoRoot = await getRepoRoot(presentationsDir);
      }
    }
    return gitAvailable;
  }

  router.get("/status", async (req, res) => {
    try {
      const available = await ensureGitInfo();
      if (!available || !repoRoot) {
        return res.json({ available: false });
      }

      const branch = await getCurrentBranch(repoRoot);

      const filename = req.query.filename as string | undefined;
      let fileStatus = null;

      if (filename && isValidFilename(filename)) {
        const fullPath = path.join(presentationsDir, filename);
        const relativePath = path.relative(repoRoot, fullPath);
        fileStatus = await getFileStatus(repoRoot, relativePath);
      }

      res.json({ available: true, branch, fileStatus });
    } catch {
      // Reset cache on unexpected errors so next request retries
      gitAvailable = null;
      repoRoot = null;
      res.json({ available: false });
    }
  });

  return router;
}
