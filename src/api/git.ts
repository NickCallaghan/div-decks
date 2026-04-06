export interface GitStatus {
  available: boolean;
  branch?: string;
  fileStatus?: "clean" | "modified" | "staged" | "untracked" | "added" | null;
}

export async function fetchGitStatus(filename?: string): Promise<GitStatus> {
  try {
    const params = filename ? `?filename=${encodeURIComponent(filename)}` : "";
    const res = await fetch(`/api/git/status${params}`);
    if (!res.ok) return { available: false };
    return res.json();
  } catch {
    return { available: false };
  }
}
