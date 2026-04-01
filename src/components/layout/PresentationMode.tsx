import { useEffect, useState, useMemo } from 'react';
import { useEditorStore } from '../../store/editor-store';
import { serializePresentation } from '../../lib/serializer';

interface PresentationModeProps {
  onExit: () => void;
}

export function PresentationMode({ onExit }: PresentationModeProps) {
  const presentation = useEditorStore((s) => s.presentation);
  const activeSlideIndex = useEditorStore((s) => s.activeSlideIndex);
  const [showHint, setShowHint] = useState(true);

  // Build the full HTML with a start-at-slide script injected
  const srcdoc = useMemo(() => {
    if (!presentation) return '';
    const html = serializePresentation(presentation);
    // Inject a script that scrolls to the active slide after SlideEngine inits
    // No CSS overrides — let the original SlideEngine run exactly as-is.
    // Only inject a script to start at the current slide.
    const startScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  // Wait for SlideEngine to init, then jump to the active slide instantly
  setTimeout(function() {
    var deck = document.querySelector('.deck');
    var slides = document.querySelectorAll('.slide');
    var target = slides[${activeSlideIndex}];
    if (target && deck) {
      // Temporarily disable smooth scroll to jump without animation
      deck.style.scrollBehavior = 'auto';
      target.scrollIntoView();
      target.classList.add('visible');
      // Re-enable smooth scroll for subsequent navigation
      requestAnimationFrame(function() {
        deck.style.scrollBehavior = 'smooth';
      });
    }
  }, 150);
});
</script>`;
    return html.replace('</body>', startScript + '\n</body>');
  }, [presentation, activeSlideIndex]);

  // Escape exits presentation mode
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        e.preventDefault();
        e.stopPropagation();
        onExit();
      }
    }
    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [onExit]);

  // Fade hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!presentation) return null;

  return (
    <div style={{
      position: 'fixed',
      inset: 0,
      zIndex: 9999,
      background: '#000',
    }}>
      <iframe
        srcDoc={srcdoc}
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
        }}
        sandbox="allow-scripts allow-same-origin"
        title="Presentation"
      />
      <div style={{
        position: 'fixed',
        bottom: 24,
        left: '50%',
        transform: 'translateX(-50%)',
        padding: '8px 16px',
        borderRadius: 8,
        background: 'rgba(0, 0, 0, 0.7)',
        color: 'rgba(255, 255, 255, 0.8)',
        fontSize: 13,
        fontFamily: 'system-ui, sans-serif',
        backdropFilter: 'blur(4px)',
        opacity: showHint ? 1 : 0,
        transition: 'opacity 0.5s ease',
        pointerEvents: 'none',
        zIndex: 10000,
      }}>
        Press <kbd style={{
          padding: '1px 6px',
          background: 'rgba(255,255,255,0.15)',
          borderRadius: 4,
          border: '1px solid rgba(255,255,255,0.2)',
          fontSize: 12,
        }}>Esc</kbd> to exit
      </div>
    </div>
  );
}
