import type { GitStatus } from "../../api/git";
import { Separator } from "./shared";

interface GitStatusBadgeProps {
  gitStatus: GitStatus;
}

export function GitStatusBadge({ gitStatus }: GitStatusBadgeProps) {
  if (!gitStatus.available) return null;

  return (
    <>
      <Separator />
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 6,
          fontSize: 12,
        }}
      >
        <span
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            color: "var(--color-gray-500)",
          }}
        >
          <svg
            width="14"
            height="14"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
          >
            <line x1="6" y1="3" x2="6" y2="15" />
            <circle cx="18" cy="6" r="3" />
            <circle cx="6" cy="18" r="3" />
            <path d="M18 9a9 9 0 0 1-9 9" />
          </svg>
          {gitStatus.branch ?? "detached"}
        </span>
        {gitStatus.fileStatus && (
          <span
            style={{
              padding: "1px 8px",
              borderRadius: 10,
              fontSize: 11,
              fontWeight: 500,
              background: gitStatusBg(gitStatus.fileStatus),
              color: gitStatusColor(gitStatus.fileStatus),
            }}
          >
            {gitStatus.fileStatus}
          </span>
        )}
      </div>
    </>
  );
}

function gitStatusColor(status: string): string {
  switch (status) {
    case "clean":
    case "added":
      return "var(--color-green-700)";
    case "modified":
      return "var(--color-amber-700)";
    case "staged":
      return "var(--color-blue-700)";
    case "untracked":
      return "var(--color-gray-500)";
    default:
      return "var(--color-gray-500)";
  }
}

function gitStatusBg(status: string): string {
  switch (status) {
    case "clean":
    case "added":
      return "var(--color-green-50)";
    case "modified":
      return "var(--color-amber-50)";
    case "staged":
      return "var(--color-blue-50)";
    case "untracked":
      return "var(--color-gray-50)";
    default:
      return "var(--color-gray-50)";
  }
}
