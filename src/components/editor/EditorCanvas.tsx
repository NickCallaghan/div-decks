import { useEditorStore } from '../../store/editor-store';
import { SlideRenderer } from './SlideRenderer';

export function EditorCanvas() {
  const presentation = useEditorStore((s) => s.presentation);
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex);

  if (!presentation) {
    return (
      <div className="empty-state">
        <div className="empty-state__icon">
          <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" opacity="0.4">
            <rect x="2" y="3" width="20" height="18" rx="2" />
            <line x1="6" y1="8" x2="18" y2="8" />
            <line x1="6" y1="12" x2="14" y2="12" />
            <line x1="6" y1="16" x2="10" y2="16" />
          </svg>
        </div>
        <div className="empty-state__title">No presentation open</div>
        <div className="empty-state__desc">
          Select a file from the sidebar to start editing
        </div>
      </div>
    );
  }

  const slide = presentation.slides[activeSlideIndex];
  if (!slide) return null;

  return (
    <div className="editor-canvas">
      <div className="editor-canvas__frame">
        <SlideRenderer
          key={slide.id}
          slide={slide}
          head={presentation.head}
          interactive
        />
      </div>
    </div>
  );
}
