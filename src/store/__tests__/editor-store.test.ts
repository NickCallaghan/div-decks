import { describe, it, expect, beforeEach } from "vitest";
import { useEditorStore } from "../editor-store";
import type { PresentationModel } from "../../types/presentation";

function makePresentation(slideCount = 3): PresentationModel {
  return {
    filename: "test.html",
    title: "Test",
    head: "<style></style>",
    scriptBlock: "<script></script>",
    slides: Array.from({ length: slideCount }, (_, i) => ({
      id: `slide-${i}`,
      index: i,
      type: "content" as const,
      outerHtml: `<section class="slide slide--content"><p>Slide ${i}</p></section>`,
    })),
  };
}

describe("editor-store", () => {
  beforeEach(() => {
    // Reset store to initial state
    useEditorStore.setState({
      activeTab: "files",
      files: [],
      presentation: null,
      activeSlideIndex: 0,
      selectedElement: null,
      isEditing: false,
      isDirty: false,
      savedHtml: null,
      undoStack: [],
      redoStack: [],
      canUndo: false,
      canRedo: false,
    });
  });

  describe("setPresentation", () => {
    it("sets the presentation and resets state", () => {
      const pres = makePresentation();
      useEditorStore.getState().setPresentation(pres);
      const state = useEditorStore.getState();
      expect(state.presentation).toBe(pres);
      expect(state.activeSlideIndex).toBe(0);
      expect(state.selectedElement).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.undoStack).toHaveLength(0);
      expect(state.redoStack).toHaveLength(0);
    });

    it("clears state when set to null (e.g. after file deletion)", () => {
      // Set up a presentation with some editing state
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edited</section>");
      useEditorStore.getState().setActiveSlideIndex(2);

      // Clear it
      useEditorStore.getState().setPresentation(null);
      const state = useEditorStore.getState();
      expect(state.presentation).toBeNull();
      expect(state.activeSlideIndex).toBe(0);
      expect(state.selectedElement).toBeNull();
      expect(state.isDirty).toBe(false);
      expect(state.canUndo).toBe(false);
      expect(state.canRedo).toBe(false);
    });
  });

  describe("setActiveSlideIndex", () => {
    it("changes the active slide and clears selection", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().setSelectedElement({
        selector: "p",
        tagName: "P",
        className: "",
        text: "test",
        rect: { top: 0, left: 0, width: 100, height: 20 },
      });
      useEditorStore.getState().setActiveSlideIndex(2);
      const state = useEditorStore.getState();
      expect(state.activeSlideIndex).toBe(2);
      expect(state.selectedElement).toBeNull();
    });
  });

  describe("updateSlideHtml", () => {
    it("updates the slide outerHtml and marks dirty", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore
        .getState()
        .updateSlideHtml("slide-1", "<section>Updated</section>");
      const state = useEditorStore.getState();
      expect(state.presentation!.slides[1].outerHtml).toBe(
        "<section>Updated</section>",
      );
      expect(state.isDirty).toBe(true);
    });

    it("pushes to undo stack", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 1</section>");
      expect(useEditorStore.getState().undoStack).toHaveLength(1);
      expect(useEditorStore.getState().canUndo).toBe(true);
    });

    it("clears redo stack on new edit", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 1</section>");
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().canRedo).toBe(true);
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 2</section>");
      expect(useEditorStore.getState().canRedo).toBe(false);
      expect(useEditorStore.getState().redoStack).toHaveLength(0);
    });
  });

  describe("reorderSlides", () => {
    it("moves a slide to a new position", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().reorderSlides(2, 0);
      const slides = useEditorStore.getState().presentation!.slides;
      expect(slides[0].id).toBe("slide-2");
      expect(slides[1].id).toBe("slide-0");
      expect(slides[2].id).toBe("slide-1");
    });

    it("re-indexes slides after reorder", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().reorderSlides(2, 0);
      const slides = useEditorStore.getState().presentation!.slides;
      expect(slides.map((s) => s.index)).toEqual([0, 1, 2]);
    });

    it("updates activeSlideIndex to the new position", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().reorderSlides(2, 0);
      expect(useEditorStore.getState().activeSlideIndex).toBe(0);
    });

    it("marks dirty and pushes undo", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().reorderSlides(1, 0);
      expect(useEditorStore.getState().isDirty).toBe(true);
      expect(useEditorStore.getState().canUndo).toBe(true);
    });
  });

  describe("undo / redo", () => {
    it("undo restores previous slide state", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      const originalHtml =
        useEditorStore.getState().presentation!.slides[0].outerHtml;
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Changed</section>");
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().presentation!.slides[0].outerHtml).toBe(
        originalHtml,
      );
    });

    it("redo restores the undone change", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Changed</section>");
      useEditorStore.getState().undo();
      useEditorStore.getState().redo();
      expect(useEditorStore.getState().presentation!.slides[0].outerHtml).toBe(
        "<section>Changed</section>",
      );
    });

    it("multiple undos walk back through history", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      const original =
        useEditorStore.getState().presentation!.slides[0].outerHtml;
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 1</section>");
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 2</section>");
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Edit 3</section>");
      useEditorStore.getState().undo(); // back to Edit 2
      useEditorStore.getState().undo(); // back to Edit 1
      useEditorStore.getState().undo(); // back to original
      expect(useEditorStore.getState().presentation!.slides[0].outerHtml).toBe(
        original,
      );
      expect(useEditorStore.getState().canUndo).toBe(false);
    });

    it("undo with empty stack is a no-op", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      const before = useEditorStore.getState().presentation;
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().presentation).toBe(before);
    });

    it("redo with empty stack is a no-op", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      const before = useEditorStore.getState().presentation;
      useEditorStore.getState().redo();
      expect(useEditorStore.getState().presentation).toBe(before);
    });

    it("undo clears selection", () => {
      useEditorStore.getState().setPresentation(makePresentation());
      useEditorStore.getState().setSelectedElement({
        selector: "p",
        tagName: "P",
        className: "",
        text: "test",
        rect: { top: 0, left: 0, width: 100, height: 20 },
      });
      useEditorStore
        .getState()
        .updateSlideHtml("slide-0", "<section>Changed</section>");
      useEditorStore.getState().undo();
      expect(useEditorStore.getState().selectedElement).toBeNull();
    });
  });
});
