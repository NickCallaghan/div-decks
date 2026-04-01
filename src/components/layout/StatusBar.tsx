import { useEditorStore } from '../../store/editor-store';

export function StatusBar() {
  const presentation = useEditorStore((s) => s.presentation);
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex);
  const isDirty = useEditorStore((s) => s.isDirty);
  const selectedElement = useEditorStore((s) => s.selectedElement);
  const isEditing = useEditorStore((s) => s.isEditing);

  return (
    <div className="app-statusbar">
      {presentation ? (
        <>
          <span>{presentation.filename}</span>
          <span style={{ color: 'var(--color-gray-300)' }}>|</span>
          <span>Slide {activeSlideIndex + 1} of {presentation.slides.length}</span>
          <span style={{ color: 'var(--color-gray-300)' }}>|</span>
          <span>Type: {presentation.slides[activeSlideIndex]?.type ?? '—'}</span>
          {selectedElement && (
            <>
              <span style={{ color: 'var(--color-gray-300)' }}>|</span>
              <span style={{ color: 'var(--color-blue-500)' }}>
                Selected: &lt;{selectedElement.tagName.toLowerCase()}&gt;
                {isEditing && ' (editing)'}
              </span>
            </>
          )}
          <div style={{ flex: 1 }} />
          {isDirty && (
            <span style={{ color: 'var(--color-amber-500)' }}>Unsaved changes</span>
          )}
        </>
      ) : (
        <span>Ready</span>
      )}
    </div>
  );
}
