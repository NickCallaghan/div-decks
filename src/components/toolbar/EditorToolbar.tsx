import { useCallback, useEffect } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { usePresentation } from '../../hooks/usePresentation';

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

  const sendCommand = useCallback((command: { type: string; [key: string]: unknown }) => {
    const iframe = document.querySelector('.editor-canvas__iframe') as HTMLIFrameElement | null;
    if (iframe?.contentWindow) {
      iframe.contentWindow.postMessage(command, '*');
    }
  }, []);

  const handleSave = useCallback(async () => {
    try {
      await save();
    } catch (err) {
      console.error('Save failed:', err);
    }
  }, [save]);

  const handleReload = useCallback(async () => {
    if (!presentation) return;
    if (isDirty && !window.confirm('You have unsaved changes. Reload from disk?')) return;
    await open(presentation.filename);
  }, [presentation, isDirty, open]);

  const handleDelete = useCallback(() => {
    if (!selectedElement) return;
    sendCommand({ type: 'delete-selected' });
  }, [selectedElement, sendCommand]);

  const handleMoveUp = useCallback(() => {
    if (!selectedElement) return;
    sendCommand({ type: 'move-element', direction: 'up' });
  }, [selectedElement, sendCommand]);

  const handleMoveDown = useCallback(() => {
    if (!selectedElement) return;
    sendCommand({ type: 'move-element', direction: 'down' });
  }, [selectedElement, sendCommand]);

  const handleDeselect = useCallback(() => {
    sendCommand({ type: 'deselect' });
  }, [sendCommand]);

  // Keyboard shortcuts
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === 's') {
        e.preventDefault();
        handleSave();
      }
      if (mod && e.key === 'z' && !e.shiftKey) {
        e.preventDefault();
        undo();
      }
      if (mod && e.key === 'z' && e.shiftKey) {
        e.preventDefault();
        redo();
      }
      if (mod && e.key === 'y') {
        e.preventDefault();
        redo();
      }
      // Arrow keys to navigate slides (only when not editing text)
      if (!mod && (e.key === 'ArrowLeft' || e.key === 'ArrowRight')) {
        const isEditing = document.activeElement?.closest('iframe') &&
          (e.target as HTMLElement).closest?.('[contenteditable]');
        if (!isEditing) {
          e.preventDefault();
          const total = useEditorStore.getState().presentation?.slides.length ?? 0;
          const current = useEditorStore.getState().activeSlideIndex;
          if (e.key === 'ArrowLeft' && current > 0) {
            useEditorStore.getState().setActiveSlideIndex(current - 1);
          } else if (e.key === 'ArrowRight' && current < total - 1) {
            useEditorStore.getState().setActiveSlideIndex(current + 1);
          }
        }
      }
      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedElement && !(e.target as HTMLElement).closest('[contenteditable]')) {
          e.preventDefault();
          handleDelete();
        }
      }
      if (e.key === 'Escape') {
        handleDeselect();
      }
    }
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleDelete, handleDeselect, selectedElement, undo, redo]);

  const totalSlides = presentation?.slides.length ?? 0;

  return (
    <div className="app-toolbar">
      {/* Logo / title */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ color: 'var(--color-blue-500)' }}>
          <rect x="2" y="3" width="20" height="18" rx="2" />
          <line x1="8" y1="21" x2="8" y2="3" />
        </svg>
        <span style={{ fontWeight: 600, fontSize: 14, color: 'var(--color-gray-900)' }}>
          Slide Editor
        </span>
      </div>

      {presentation && (
        <>
          <Separator />

          {/* File name */}
          <span style={{ fontSize: 13, color: 'var(--color-gray-500)' }}>
            {presentation.filename.replace('.html', '')}
            {isDirty && <span style={{ color: 'var(--color-amber-500)', marginLeft: 4 }}>*</span>}
          </span>

          <div style={{ flex: 1 }} />

          {/* Undo / Redo / Reload */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <ToolbarButton onClick={undo} disabled={!canUndo} title="Undo (Cmd+Z)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="1 4 1 10 7 10" />
                <path d="M3.51 15a9 9 0 1 0 2.13-9.36L1 10" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={redo} disabled={!canRedo} title="Redo (Cmd+Shift+Z)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M20.49 15a9 9 0 1 1-2.13-9.36L23 10" />
              </svg>
            </ToolbarButton>
            <ToolbarButton onClick={handleReload} title="Reload from disk">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="23 4 23 10 17 10" />
                <path d="M1 20v-6h6" />
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15" />
              </svg>
            </ToolbarButton>
          </div>

          <Separator />

          {/* Navigation */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <ToolbarButton
              onClick={() => setActiveSlideIndex(Math.max(0, activeSlideIndex - 1))}
              disabled={activeSlideIndex === 0}
              title="Previous slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="15 18 9 12 15 6" />
              </svg>
            </ToolbarButton>
            <span style={{ fontSize: 12, color: 'var(--color-gray-500)', fontVariantNumeric: 'tabular-nums', minWidth: 48, textAlign: 'center' }}>
              {activeSlideIndex + 1} / {totalSlides}
            </span>
            <ToolbarButton
              onClick={() => setActiveSlideIndex(Math.min(totalSlides - 1, activeSlideIndex + 1))}
              disabled={activeSlideIndex >= totalSlides - 1}
              title="Next slide"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <polyline points="9 18 15 12 9 6" />
              </svg>
            </ToolbarButton>
          </div>

          <Separator />

          {/* Selected element indicator */}
          {selectedElement && (
            <>
              <span style={{ fontSize: 11, color: 'var(--color-blue-500)', display: 'flex', alignItems: 'center', gap: 4 }}>
                <span style={{ padding: '2px 6px', background: 'var(--color-blue-50)', borderRadius: 4, fontFamily: 'monospace' }}>
                  &lt;{selectedElement.tagName.toLowerCase()}&gt;
                </span>
              </span>
              <ToolbarButton onClick={handleDeselect} title="Deselect (Esc)">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </svg>
              </ToolbarButton>
              <Separator />
            </>
          )}

          {/* Play */}
          {onPlay && (
            <ToolbarButton onClick={onPlay} title="Present (Play)">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <polygon points="6 3 20 12 6 21" />
              </svg>
            </ToolbarButton>
          )}

          {/* Save */}
          <button
            onClick={handleSave}
            disabled={!isDirty}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              height: 32,
              padding: '0 14px',
              border: 'none',
              borderRadius: 6,
              fontSize: 13,
              fontWeight: 500,
              cursor: isDirty ? 'pointer' : 'default',
              background: isDirty ? 'var(--color-blue-500)' : 'var(--color-gray-100)',
              color: isDirty ? 'white' : 'var(--color-gray-400)',
              transition: 'background 0.15s, color 0.15s',
              whiteSpace: 'nowrap',
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

function Separator() {
  return <div style={{ width: 1, height: 24, background: 'var(--color-gray-200)', margin: '0 6px', flexShrink: 0 }} />;
}

function ToolbarButton({ children, onClick, disabled, title, danger }: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  title: string;
  danger?: boolean;
}) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      title={title}
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        width: 30,
        height: 30,
        border: 'none',
        background: 'transparent',
        borderRadius: 6,
        cursor: disabled ? 'default' : 'pointer',
        color: disabled ? 'var(--color-gray-300)' : danger ? 'var(--color-red-500)' : 'var(--color-gray-600)',
        transition: 'background 0.15s, color 0.15s',
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
