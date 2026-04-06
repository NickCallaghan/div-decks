import { useEffect } from "react";
import { useEditorStore, type SelectedElement } from "../store/editor-store";

interface KeyboardShortcutDeps {
  handleSave: () => void;
  handleDelete: () => void;
  handleDeselect: () => void;
  handleExportPdf: () => void;
  selectedElement: SelectedElement | null;
  undo: () => void;
  redo: () => void;
}

export function useKeyboardShortcuts({
  handleSave,
  handleDelete,
  handleDeselect,
  handleExportPdf,
  selectedElement,
  undo,
  redo,
}: KeyboardShortcutDeps): void {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "s") {
        e.preventDefault();
        handleSave();
      }
      if (mod && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === "y") {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === "p") {
        e.preventDefault();
        handleExportPdf();
      }
      // Arrow keys to navigate slides (only when not editing text)
      if (!mod && (e.key === "ArrowLeft" || e.key === "ArrowRight")) {
        const isEditing =
          document.activeElement?.closest("iframe") &&
          (e.target as HTMLElement).closest?.("[contenteditable]");
        if (!isEditing) {
          e.preventDefault();
          const total =
            useEditorStore.getState().presentation?.slides.length ?? 0;
          const current = useEditorStore.getState().activeSlideIndex;
          if (e.key === "ArrowLeft" && current > 0) {
            useEditorStore.getState().setActiveSlideIndex(current - 1);
          } else if (e.key === "ArrowRight" && current < total - 1) {
            useEditorStore.getState().setActiveSlideIndex(current + 1);
          }
        }
      }
      if (e.key === "Delete" || e.key === "Backspace") {
        if (
          selectedElement &&
          !(e.target as HTMLElement).closest("[contenteditable]")
        ) {
          e.preventDefault();
          handleDelete();
        }
      }
      if (e.key === "Escape") {
        handleDeselect();
      }
    }
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [
    handleSave,
    handleDelete,
    handleDeselect,
    handleExportPdf,
    selectedElement,
    undo,
    redo,
  ]);
}
