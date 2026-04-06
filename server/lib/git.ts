import { execFile } from "node:child_process";
import { promisify } from "node:util";

const execFileAsync = promisify(execFile);
const TIMEOUT = 5_000;

export type FileStatus =
  | "clean"
  | "modified"
  | "staged"
  | "untracked"
  | "added"
  | null;

export async function isGitRepo(cwd: string): Promise<boolean> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--is-inside-work-tree"],
      { cwd, timeout: TIMEOUT },
    );
    return stdout.trim() === "true";
  } catch {
    return false;
  }
}

export async function getRepoRoot(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["rev-parse", "--show-toplevel"],
      { cwd, timeout: TIMEOUT },
    );
    return stdout.trim();
  } catch {
    return null;
  }
}

export async function getCurrentBranch(cwd: string): Promise<string | null> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["branch", "--show-current"],
      { cwd, timeout: TIMEOUT },
    );
    const branch = stdout.trim();
    if (branch) return branch;

    // Detached HEAD — fall back to short SHA
    const { stdout: sha } = await execFileAsync(
      "git",
      ["rev-parse", "--short", "HEAD"],
      { cwd, timeout: TIMEOUT },
    );
    return sha.trim() || null;
  } catch {
    return null;
  }
}

export function parseFileStatus(porcelain: string): FileStatus {
  // Strip trailing whitespace/newlines but preserve leading spaces (they're meaningful)
  const output = porcelain.replace(/\s+$/, "");
  if (!output) return "clean";

  // First two characters are the status codes: [index][worktree]
  const index = output[0];
  const worktree = output[1];

  if (index === "?" && worktree === "?") return "untracked";
  if (index === "A" && worktree === " ") return "added";

  // Any worktree modification takes priority over staged state
  if (worktree !== " ") return "modified";

  // Only index changes remain (staged)
  if (index !== " ") return "staged";

  return "modified";
}

export async function getFileStatus(
  cwd: string,
  relativePath: string,
): Promise<FileStatus> {
  try {
    const { stdout } = await execFileAsync(
      "git",
      ["status", "--porcelain", "--", relativePath],
      { cwd, timeout: TIMEOUT },
    );
    return parseFileStatus(stdout);
  } catch {
    return null;
  }
}
