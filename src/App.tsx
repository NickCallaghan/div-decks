import { useState, useEffect, useCallback } from "react";
import { FileBrowser } from "./components/file-browser/FileBrowser";
import { SlideOverview } from "./components/slide-overview/SlideOverview";
import { EditorCanvas } from "./components/editor/EditorCanvas";
import { EditorToolbar } from "./components/toolbar/EditorToolbar";
import { StatusBar } from "./components/layout/StatusBar";
import { ShortcutHints } from "./components/layout/ShortcutHints";
import { PresentationMode } from "./components/layout/PresentationMode";
import { useEditorStore } from "./store/editor-store";
import { usePresentation } from "./hooks/usePresentation";

export default function App() {
  const activeTab = useEditorStore((s) => s.activeTab);
  const setActiveTab = useEditorStore((s) => s.setActiveTab);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const [isPresenting, setIsPresenting] = useState(false);
  const exitPresentation = useCallback(() => setIsPresenting(false), []);
  const presentation = useEditorStore((s) => s.presentation);
  const { open } = usePresentation();

  // Re-open last file after page reload (e.g. Vite-triggered)
  useEffect(() => {
    const savedFile = sessionStorage.getItem("activeFile");
    if (savedFile && !useEditorStore.getState().presentation) {
      open(savedFile).catch(() => {
        sessionStorage.removeItem("activeFile");
      });
    }
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const toggleShortcuts = useCallback(() => setShowShortcuts((v) => !v), []);

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "i") {
        e.preventDefault();
        toggleShortcuts();
      }
      if (e.key === "Escape" && showShortcuts) {
        setShowShortcuts(false);
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleShortcuts, showShortcuts]);

  return (
    <div className="app-shell">
      <EditorToolbar
        onPlay={
          presentation
            ? () => {
                // Deselect everything before presenting
                useEditorStore.getState().setSelectedElement(null);
                useEditorStore.getState().setIsEditing(false);
                // Tell the iframe to deselect too
                const iframe = document.querySelector(
                  ".editor-canvas__iframe",
                ) as HTMLIFrameElement | null;
                if (iframe?.contentWindow)
                  iframe.contentWindow.postMessage({ type: "deselect" }, "*");
                // Small delay to let the deselect propagate before serializing
                setTimeout(() => setIsPresenting(true), 50);
              }
            : undefined
        }
      />

      <div className="app-sidebar">
        {/* Tab bar */}
        <div
          style={{
            display: "flex",
            borderBottom: "1px solid var(--color-gray-200)",
            background: "var(--color-gray-50)",
          }}
        >
          <TabButton
            label="Files"
            isActive={activeTab === "files"}
            onClick={() => setActiveTab("files")}
          />
          <TabButton
            label="Slides"
            isActive={activeTab === "slides"}
            onClick={() => setActiveTab("slides")}
            disabled={!presentation}
            count={presentation?.slides.length}
          />
        </div>

        {/* Tab content */}
        <div className="sidebar-tab-content">
          {activeTab === "files" && <FileBrowser />}
          {activeTab === "slides" && <SlideOverview />}
        </div>
      </div>

      <div className="app-main">
        <EditorCanvas />
      </div>

      <StatusBar />

      {showShortcuts && (
        <ShortcutHints onClose={() => setShowShortcuts(false)} />
      )}
      {isPresenting && (
        <PresentationMode
          startSlide={useEditorStore.getState().activeSlideIndex}
          onExit={exitPresentation}
        />
      )}
    </div>
  );
}

function TabButton({
  label,
  isActive,
  onClick,
  disabled,
  count,
}: {
  label: string;
  isActive: boolean;
  onClick: () => void;
  disabled?: boolean;
  count?: number;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1,
        padding: "10px 16px",
        fontSize: 13,
        fontWeight: isActive ? 600 : 400,
        color: disabled
          ? "var(--color-gray-300)"
          : isActive
            ? "var(--color-gray-900)"
            : "var(--color-gray-500)",
        background: "transparent",
        border: "none",
        borderBottom: isActive
          ? "2px solid var(--color-blue-500)"
          : "2px solid transparent",
        cursor: disabled ? "default" : "pointer",
        transition: "all 0.15s",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 6,
      }}
    >
      {label}
      {count !== undefined && (
        <span
          style={{
            fontSize: 11,
            padding: "1px 6px",
            borderRadius: 10,
            background: isActive
              ? "var(--color-blue-50)"
              : "var(--color-gray-100)",
            color: isActive ? "var(--color-blue-600)" : "var(--color-gray-400)",
          }}
        >
          {count}
        </span>
      )}
    </button>
  );
}
