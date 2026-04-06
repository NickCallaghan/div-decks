import { describe, it, expect } from "vitest";
import path from "node:path";
import os from "node:os";
import fs from "node:fs/promises";
import {
  isGitRepo,
  getRepoRoot,
  getCurrentBranch,
  parseFileStatus,
} from "../git.js";

const projectRoot = path.resolve(import.meta.dirname, "..", "..", "..");

describe("isGitRepo", () => {
  it("returns true for a directory inside a git repo", async () => {
    expect(await isGitRepo(projectRoot)).toBe(true);
  });

  it("returns false for a temp directory outside any repo", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "git-test-"));
    try {
      expect(await isGitRepo(tmpDir)).toBe(false);
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });
});

describe("getRepoRoot", () => {
  it("returns a non-null path for a git repo", async () => {
    const root = await getRepoRoot(projectRoot);
    expect(root).toBeTruthy();
    expect(typeof root).toBe("string");
  });

  it("returns null for a non-repo directory", async () => {
    const tmpDir = await fs.mkdtemp(path.join(os.tmpdir(), "git-test-"));
    try {
      expect(await getRepoRoot(tmpDir)).toBeNull();
    } finally {
      await fs.rm(tmpDir, { recursive: true });
    }
  });
});

describe("getCurrentBranch", () => {
  it("returns a non-empty string for a git repo", async () => {
    const branch = await getCurrentBranch(projectRoot);
    expect(branch).toBeTruthy();
    expect(typeof branch).toBe("string");
  });
});

describe("parseFileStatus", () => {
  it("returns 'clean' for empty output", () => {
    expect(parseFileStatus("")).toBe("clean");
    expect(parseFileStatus("  \n  ")).toBe("clean");
  });

  it("returns 'modified' for unstaged changes", () => {
    expect(parseFileStatus(" M src/file.ts")).toBe("modified");
  });

  it("returns 'staged' for staged changes", () => {
    expect(parseFileStatus("M  src/file.ts")).toBe("staged");
  });

  it("returns 'modified' for both staged and unstaged", () => {
    expect(parseFileStatus("MM src/file.ts")).toBe("modified");
  });

  it("returns 'untracked' for new untracked files", () => {
    expect(parseFileStatus("?? src/file.ts")).toBe("untracked");
  });

  it("returns 'added' for newly staged files", () => {
    expect(parseFileStatus("A  src/file.ts")).toBe("added");
  });

  it("returns 'modified' for added then modified files", () => {
    expect(parseFileStatus("AM src/file.ts")).toBe("modified");
  });

  it("returns 'staged' for deleted files in index", () => {
    expect(parseFileStatus("D  src/file.ts")).toBe("staged");
  });

  it("returns 'modified' for deleted files in worktree", () => {
    expect(parseFileStatus(" D src/file.ts")).toBe("modified");
  });
});
