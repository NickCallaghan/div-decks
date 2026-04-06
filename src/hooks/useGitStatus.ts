import { useState, useEffect, useCallback } from "react";
import { fetchGitStatus, type GitStatus } from "../api/git";
import { useEditorStore } from "../store/editor-store";

const POLL_INTERVAL = 30_000;

export function useGitStatus(): GitStatus | null {
  const filename = useEditorStore((s) => s.presentation?.filename ?? null);
  const [status, setStatus] = useState<GitStatus | null>(null);

  const refresh = useCallback(async () => {
    if (!filename) {
      setStatus(null);
      return;
    }
    const result = await fetchGitStatus(filename);
    setStatus(result);
  }, [filename]);

  // Fetch on mount and when filename changes
  useEffect(() => {
    refresh();
  }, [refresh]);

  // Poll on interval
  useEffect(() => {
    if (!filename) return;
    const interval = setInterval(refresh, POLL_INTERVAL);
    return () => clearInterval(interval);
  }, [filename, refresh]);

  // Re-fetch when save completes
  useEffect(() => {
    const handler = () => refresh();
    window.addEventListener("git-status-refresh", handler);
    return () => window.removeEventListener("git-status-refresh", handler);
  }, [refresh]);

  return status;
}
