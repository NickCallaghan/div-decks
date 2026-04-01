import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { SlideModel } from '../../types/presentation';
import { EDITOR_OVERRIDE_CSS } from '../../lib/bridge';

interface SortableSlideProps {
  slide: SlideModel;
  head: string;
  isActive: boolean;
  slideNumber: number;
  onClick: () => void;
}

export function SortableSlide({ slide, head, isActive, slideNumber, onClick }: SortableSlideProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: slide.id });

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
    zIndex: isDragging ? 10 : 'auto',
  };

  const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
${head}
${EDITOR_OVERRIDE_CSS}
<style>* { pointer-events: none !important; } *:hover { outline: none !important; }</style>
</head>
<body><div class="deck">${slide.outerHtml}</div></body>
</html>`;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`slide-thumbnail ${isActive ? 'slide-thumbnail--active' : ''}`}
      onClick={onClick}
    >
      {/* Drag handle area — the entire top bar is draggable */}
      <div
        className="slide-thumbnail__drag-bar"
        {...attributes}
        {...listeners}
      >
        <svg width="12" height="12" viewBox="0 0 24 24" fill="currentColor" style={{ opacity: 0.4 }}>
          <circle cx="8" cy="6" r="2" />
          <circle cx="16" cy="6" r="2" />
          <circle cx="8" cy="12" r="2" />
          <circle cx="16" cy="12" r="2" />
          <circle cx="8" cy="18" r="2" />
          <circle cx="16" cy="18" r="2" />
        </svg>
        <span className="slide-thumbnail__number">{slideNumber}</span>
        <span className="slide-thumbnail__type">{slide.type}</span>
      </div>
      <div className="slide-thumbnail__iframe-container">
        <iframe
          className="slide-thumbnail__iframe"
          srcDoc={srcdoc}
          sandbox="allow-same-origin"
          title={`Slide ${slideNumber}`}
          loading="lazy"
          tabIndex={-1}
          style={{ '--thumb-scale': 0.22 } as React.CSSProperties}
        />
      </div>
    </div>
  );
}
