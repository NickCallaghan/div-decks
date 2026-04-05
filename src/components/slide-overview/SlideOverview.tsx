import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useEditorStore } from "../../store/editor-store";
import { SortableSlide } from "./SortableSlide";

export function SlideOverview() {
  const presentation = useEditorStore((s) => s.presentation);
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex);
  const setActiveSlideIndex = useEditorStore((s) => s.setActiveSlideIndex);
  const reorderSlides = useEditorStore((s) => s.reorderSlides);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
  );

  if (!presentation) {
    return (
      <div className="empty-state" style={{ padding: "32px 16px" }}>
        <div className="empty-state__title">No slides</div>
        <div className="empty-state__desc">
          Open a presentation to see its slides
        </div>
      </div>
    );
  }

  const slideIds = presentation.slides.map((s) => s.id);

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    const fromIndex = presentation!.slides.findIndex((s) => s.id === active.id);
    const toIndex = presentation!.slides.findIndex((s) => s.id === over.id);
    if (fromIndex !== -1 && toIndex !== -1) {
      reorderSlides(fromIndex, toIndex);
    }
  }

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={slideIds} strategy={verticalListSortingStrategy}>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {presentation.slides.map((slide, i) => (
            <SortableSlide
              key={slide.id}
              slide={slide}
              head={presentation.head}
              isActive={i === activeSlideIndex}
              slideNumber={i + 1}
              onClick={() => setActiveSlideIndex(i)}
            />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}
