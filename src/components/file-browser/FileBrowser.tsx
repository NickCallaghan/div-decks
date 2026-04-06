import { usePresentationList } from "../../hooks/usePresentationList";
import { usePresentation } from "../../hooks/usePresentation";
import { deletePresentation } from "../../api/presentations";
import { useEditorStore } from "../../store/editor-store";
import { useToast } from "../../hooks/useToast";
import { formatSize, formatDate } from "./format";

export function FileBrowser() {
  const { files, refresh } = usePresentationList();
  const { open } = usePresentation();
  const activeFile = useEditorStore((s) => s.presentation?.filename);
  const setPresentation = useEditorStore((s) => s.setPresentation);
  const toast = useToast();

  const handleDelete = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    const displayName = filename.replace(".html", "");
    if (!window.confirm(`Delete "${displayName}"?`)) return;
    try {
      await deletePresentation(filename);
      if (filename === activeFile) {
        setPresentation(null);
      }
      refresh();
      toast.success(`Deleted "${displayName}"`);
    } catch {
      toast.error("Delete failed");
    }
  };

  if (files.length === 0) {
    return (
      <div className="empty-state" style={{ padding: "32px 16px" }}>
        <div className="empty-state__title">No presentations</div>
        <div className="empty-state__desc">
          Add .html slide decks to the <code>presentations/</code> folder
        </div>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
      {files.map((file) => (
        <div
          key={file.name}
          className={`file-item ${file.name === activeFile ? "file-item--active" : ""}`}
          onClick={() =>
            open(file.name).catch(() => toast.error("Failed to open file"))
          }
        >
          <svg
            width="20"
            height="20"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.5"
            style={{ flexShrink: 0, color: "var(--color-gray-400)" }}
          >
            <rect x="4" y="2" width="16" height="20" rx="2" />
            <line x1="8" y1="6" x2="16" y2="6" />
            <line x1="8" y1="10" x2="16" y2="10" />
            <line x1="8" y1="14" x2="12" y2="14" />
          </svg>
          <div style={{ minWidth: 0, flex: 1 }}>
            <div className="file-item__name">
              {file.name.replace(".html", "")}
            </div>
            <div className="file-item__meta">
              {formatSize(file.size)} &middot; {formatDate(file.modified)}
            </div>
          </div>
          <button
            onClick={(e) => handleDelete(e, file.name)}
            title="Delete"
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              width: 28,
              height: 28,
              border: "none",
              background: "transparent",
              borderRadius: 6,
              cursor: "pointer",
              color: "var(--color-gray-400)",
              flexShrink: 0,
              opacity: 0,
              transition: "opacity 0.15s, color 0.15s",
            }}
            className="file-item__delete"
          >
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <polyline points="3 6 5 6 21 6" />
              <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
              <path d="M10 11v6" />
              <path d="M14 11v6" />
              <path d="M9 6V4a1 1 0 0 1 1-1h4a1 1 0 0 1 1 1v2" />
            </svg>
          </button>
        </div>
      ))}
    </div>
  );
}
