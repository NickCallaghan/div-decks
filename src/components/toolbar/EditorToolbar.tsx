import { useCallback } from "react";
import { useEditorStore } from "../../store/editor-store";
import { usePresentation } from "../../hooks/usePresentation";
import { useGitStatus } from "../../hooks/useGitStatus";
import { useToast } from "../../hooks/useToast";
import { exportPdf } from "../../lib/export-pdf";
import { useKeyboardShortcuts } from "../../hooks/useKeyboardShortcuts";
import { Separator, ToolbarButton } from "./shared";
import { GitStatusBadge } from "./GitStatusBadge";
import { SlideNavigation } from "./SlideNavigation";
import { SelectedElementIndicator } from "./SelectedElementIndicator";

interface EditorToolbarProps {
  onPlay?: () => void;
}

export function EditorToolbar({ onPlay }: EditorToolbarProps) {
  const presentation = useEditorStore((s) => s.presentation);
  const isDirty = useEditorStore((s) => s.isDirty);
  const selectedElement = useEditorStore((s) => s.selectedElement);
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex);
  const setActiveSlideIndex = useEditorStore((s) => s.setActiveSlideIndex);
  const canUndo = useEditorStore((s) => s.canUndo);
  const canRedo = useEditorStore((s) => s.canRedo);
  const undo = useEditorStore((s) => s.undo);
  const redo = useEditorStore((s) => s.redo);
  const { save, open } = usePresentation();
  const gitStatus = useGitStatus();
  const toast = useToast();

  const sendCommand = useCallback(
    (command: { type: string; [key: string]: unknown }) => {
      const iframe = document.querySelector(
        ".editor-canvas__iframe",
      ) as HTMLIFrameElement | null;
      if (iframe?.contentWindow) {
        iframe.contentWindow.postMessage(command, "*");
      }
    },
    [],
  );

  const handleSave = useCallback(async () => {
    try {
      await save();
      toast.success("Saved");
    } catch {
      toast.error("Save failed");
    }
  }, [save, toast]);

  const handleReload = useCallback(async () => {
    if (!presentation) return;
    if (
      isDirty &&
      !window.confirm("You have unsaved changes. Reload from disk?")
    )
      return;
    try {
      await open(presentation.filename);
    } catch {
      toast.error("Failed to reload file");
    }
  }, [presentation, isDirty, open, toast]);

  const handleDelete = useCallback(() => {
    if (!selectedElement) return;
    sendCommand({ type: "delete-selected" });
  }, [selectedElement, sendCommand]);

  const handleDeselect = useCallback(() => {
    sendCommand({ type: "deselect" });
  }, [sendCommand]);

  const handleExportPdf = useCallback(() => {
    if (presentation) exportPdf(presentation);
  }, [presentation]);

  const handleShare = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard");
    } catch {
      toast.error("Failed to copy link");
    }
  }, [toast]);

  useKeyboardShortcuts({
    handleSave,
    handleDelete,
    handleDeselect,
    handleExportPdf,
    selectedElement,
    undo,
    redo,
  });

  const totalSlides = presentation?.slides.length ?? 0;

  return (
    <div className="app-toolbar">
      {/* Logo / title */}
      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <svg
          width="20"
          height="20"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ color: "var(--color-blue-500)" }}
        >
          <polyline points="16 18 22 12 16 6" />
          <polyline points="8 6 2 12 8 18" />
          <line x1="14" y1="4" x2="10" y2="20" />
        </svg>
        <span
          style={{
            fontWeight: 600,
            fontSize: 14,
            color: "var(--color-gray-900)",
            fontFamily:
              'ui-monospace, SFMono-Regular, "SF Mono", Menlo, Consolas, "Liberation Mono", monospace',
          }}
        >
          div.deck
        </span>
      </div>

      {presentation && (
        <>
          <Separator />

          {/* File name */}
          <span style={{ fontSize: 13, color: "var(--color-gray-500)" }}>
            {presentation.filename.replace(".html", "")}
            {isDirty && (
              <span style={{ color: "var(--color-amber-500)", marginLeft: 4 }}>
                *
              </span>
            )}
          </span>

          {/* Git status */}
          {gitStatus && <GitStatusBadge gitStatus={gitStatus} />}

          <div style={{ flex: 1 }} />

          {/* Undo / Redo / Reload */}
          <div style={{ display: "flex", alignItems: "center", gap: 2 }}>
            <ToolbarButton
              onClick={undo}
              disabled={!canUndo}
              title="Undo (Cmd+Z)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </ToolbarButton>
            <ToolbarButton
              onClick={redo}
              disabled={!canRedo}
              title="Redo (Cmd+Shift+Z)"
            >
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={handleReload} title="Reload from disk">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <polyline points="23 4 23 10 17 10" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </ToolbarButton>
          </div>

          <Separator />

          {/* Navigation */}
          <SlideNavigation
            activeSlideIndex={activeSlideIndex}
            totalSlides={totalSlides}
            onPrev={() =>
              setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))
            }
            onNext={() =>
              setActiveSlideIndex(
                Math.min(totalSlides - 1, activeSlideIndex + 1),
              )
            }
          />

          <Separator />

          {/* Selected element indicator */}
          {selectedElement && (
            <SelectedElementIndicator
              tagName={selectedElement.tagName}
              onDeselect={handleDeselect}
            />
          )}

          {/* Play */}
          {onPlay && (
            <ToolbarButton onClick={onPlay} title="Present (Play)">
              <svg
                width="16"
                height="16"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <polygon points="6 3 20 12 6 21" />
              </svg>
            </ToolbarButton>
          )}

          {/* Share link */}
          <ToolbarButton onClick={handleShare} title="Copy share link">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71" />
              <path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71" />
            </svg>
          </ToolbarButton>

          {/* Export PDF */}
          <ToolbarButton onClick={handleExportPdf} title="Export PDF (Cmd+P)">
            <svg
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </ToolbarButton>

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              height: 32,
              padding: "0 14px",
              border: "none",
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: isDirty ? "pointer" : "default",
              background: isDirty
                ? "var(--color-blue-500)"
                : "var(--color-gray-100)",
              color: isDirty ? "white" : "var(--color-gray-400)",
              transition: "background 0.15s, color 0.15s",
              whiteSpace: "nowrap",
            }}
            title="Save (Cmd+S)"
          >
            Save
          </button>
        </>
      )}
    </div>
  );
}
