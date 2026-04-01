import { create } from "zustand";
import type {
  PresentationFile,
  PresentationModel,
  SlideModel,
} from "../types/presentation";

export interface SelectedElement {
  selector: string;
  tagName: string;
  className: string;
  text: string;
  rect: { top: number; left: number; width: number; height: number };
}

// Snapshot: just the slides array (the only thing that changes during editing)
type HistorySnapshot = SlideModel[];

const MAX_HISTORY = 50;

type SidebarTab = "files" | "slides";

interface EditorState {
  // Sidebar tab
  activeTab: SidebarTab;
  setActiveTab: (tab: SidebarTab) => void;

  // File browser
  files: PresentationFile[];
  setFiles: (files: PresentationFile[]) => void;

  // Active presentation
  presentation: PresentationModel | null;
  setPresentation: (p: PresentationModel | null) => void;

  // Active slide
  activeSlideIndex: number;
  setActiveSlideIndex: (i: number) => void;

  // Selected element within a slide
  selectedElement: SelectedElement | null;
  setSelectedElement: (el: SelectedElement | null) => void;

  // Editing state
  isEditing: boolean;
  setIsEditing: (v: boolean) => void;

  // Dirty state
  isDirty: boolean;
  setIsDirty: (v: boolean) => void;
  savedHtml: string | null;
  setSavedHtml: (html: string | null) => void;

  // Undo/redo
  undoStack: HistorySnapshot[];
  redoStack: HistorySnapshot[];
  canUndo: boolean;
  canRedo: boolean;
  undo: () => void;
  redo: () => void;

  // Slide operations (push history automatically)
  updateSlideHtml: (slideId: string, outerHtml: string) => void;
  reorderSlides: (fromIndex: number, toIndex: number) => void;
}

function pushHistory(
  state: EditorState,
): Pick<EditorState, "undoStack" | "redoStack" | "canUndo" | "canRedo"> {
  if (!state.presentation)
    return {
      undoStack: state.undoStack,
      redoStack: state.redoStack,
      canUndo: state.canUndo,
      canRedo: state.canRedo,
    };
  const snapshot = state.presentation.slides.map((s) => ({ ...s }));
  const undoStack = [...state.undoStack, snapshot].slice(-MAX_HISTORY);
  return { undoStack, redoStack: [], canUndo: true, canRedo: false };
}

function getStoredTab(): SidebarTab {
  try {
    const stored = sessionStorage.getItem("activeTab");
    if (stored === "files" || stored === "slides") return stored;
  } catch {
    // sessionStorage may be unavailable
  }
  return "files";
}

export const useEditorStore = create<EditorState>((set) => ({
  activeTab: getStoredTab(),
  setActiveTab: (activeTab) => {
    try {
      sessionStorage.setItem("activeTab", activeTab);
    } catch {}
    set({ activeTab });
  },

  files: [],
  setFiles: (files) => set({ files }),

  presentation: null,
  setPresentation: (presentation) => {
    try {
      if (presentation) {
        sessionStorage.setItem("activeFile", presentation.filename);
      } else {
        sessionStorage.removeItem("activeFile");
      }
    } catch {}
    set({
      presentation,
      activeSlideIndex: 0,
      selectedElement: null,
      isDirty: false,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    });
  },

  activeSlideIndex: 0,
  setActiveSlideIndex: (activeSlideIndex) =>
    set({ activeSlideIndex, selectedElement: null }),

  selectedElement: null,
  setSelectedElement: (selectedElement) => set({ selectedElement }),

  isEditing: false,
  setIsEditing: (isEditing) => set({ isEditing }),

  isDirty: false,
  setIsDirty: (isDirty) => set({ isDirty }),

  savedHtml: null,
  setSavedHtml: (savedHtml) => set({ savedHtml }),

  // Undo/redo
  undoStack: [],
  redoStack: [],
  canUndo: false,
  canRedo: false,

  undo: () =>
    set((state) => {
      if (!state.presentation || state.undoStack.length === 0) return state;
      const undoStack = [...state.undoStack];
      const snapshot = undoStack.pop()!;
      // Push current state onto redo
      const currentSnapshot = state.presentation.slides.map((s) => ({ ...s }));
      const redoStack = [...state.redoStack, currentSnapshot];
      return {
        presentation: { ...state.presentation, slides: snapshot },
        undoStack,
        redoStack,
        canUndo: undoStack.length > 0,
        canRedo: true,
        isDirty: true,
        selectedElement: null,
      };
    }),

  redo: () =>
    set((state) => {
      if (!state.presentation || state.redoStack.length === 0) return state;
      const redoStack = [...state.redoStack];
      const snapshot = redoStack.pop()!;
      // Push current state onto undo
      const currentSnapshot = state.presentation.slides.map((s) => ({ ...s }));
      const undoStack = [...state.undoStack, currentSnapshot];
      return {
        presentation: { ...state.presentation, slides: snapshot },
        undoStack,
        redoStack,
        canUndo: true,
        canRedo: redoStack.length > 0,
        isDirty: true,
        selectedElement: null,
      };
    }),

  updateSlideHtml: (slideId, outerHtml) =>
    set((state) => {
      if (!state.presentation) return state;
      const history = pushHistory(state);
      const slides = state.presentation.slides.map((s) =>
        s.id === slideId ? { ...s, outerHtml } : s,
      );
      return {
        presentation: { ...state.presentation, slides },
        isDirty: true,
        ...history,
      };
    }),

  reorderSlides: (fromIndex, toIndex) =>
    set((state) => {
      if (!state.presentation) return state;
      const history = pushHistory(state);
      const slides = [...state.presentation.slides];
      const [moved] = slides.splice(fromIndex, 1);
      slides.splice(toIndex, 0, moved);
      const reindexed = slides.map((s, i) => ({ ...s, index: i }));
      return {
        presentation: { ...state.presentation, slides: reindexed },
        isDirty: true,
        activeSlideIndex: toIndex,
        ...history,
      };
    }),
}));
