import { useEffect, useState, useMemo, useRef } from "react";
import { useEditorStore } from "../../store/editor-store";
import { serializePresentation } from "../../lib/serializer";

interface PresentationModeProps {
  startSlide: number;
  onExit: () => void;
}

export function PresentationMode({
  startSlide,
  onExit,
}: PresentationModeProps) {
  const presentation = useEditorStore((s) => s.presentation);
  const [showHint, setShowHint] = useState(true);
  const onExitRef = useRef(onExit);
  onExitRef.current = onExit;

  // Build srcdoc ONCE on mount — never re-render the iframe
  const srcdoc = useMemo(() => {
    if (!presentation) return "";
    const html = serializePresentation(presentation);
    const startScript = `
<script>
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(function() {
    var deck = document.querySelector('.deck');
    var slides = document.querySelectorAll('.slide');
    var target = slides[${startSlide}];
    if (target && deck) {
      deck.style.scrollBehavior = 'auto';
      target.scrollIntoView();
      target.classList.add('visible');
      requestAnimationFrame(function() {
        deck.style.scrollBehavior = 'smooth';
      });
    }
  }, 150);
});
</script>`;
    return html.replace("</body>", startScript + "\n</body>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Fade hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!presentation) return null;

  return (
    <div
      data-testid="presentation-mode"
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
      }}
    >
      <iframe
        srcDoc={srcdoc}
        style={{
          width: "100%",
          height: "100%",
          border: "none",
        }}
        sandbox="allow-scripts allow-same-origin"
        title="Presentation"
      />
      <button
        type="button"
        onClick={() => onExitRef.current()}
        style={{
          position: "fixed",
          top: 16,
          right: 16,
          zIndex: 10000,
          width: 36,
          height: 36,
          borderRadius: "50%",
          border: "1px solid rgba(255,255,255,0.2)",
          background: "rgba(0,0,0,0.6)",
          color: "rgba(255,255,255,0.8)",
          fontSize: 18,
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backdropFilter: "blur(4px)",
          opacity: showHint ? 1 : 0.3,
          transition: "opacity 0.3s ease",
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.opacity = "1";
        }}
        onMouseLeave={(e) => {
          if (!showHint) e.currentTarget.style.opacity = "0.3";
        }}
        title="Exit presentation"
      >
        ✕
      </button>
      <div
        style={{
          position: "fixed",
          bottom: 24,
          left: "50%",
          transform: "translateX(-50%)",
          padding: "8px 16px",
          borderRadius: 8,
          background: "rgba(0, 0, 0, 0.7)",
          color: "rgba(255, 255, 255, 0.8)",
          fontSize: 13,
          fontFamily: "system-ui, sans-serif",
          backdropFilter: "blur(4px)",
          opacity: showHint ? 1 : 0,
          transition: "opacity 0.5s ease",
          pointerEvents: "none",
          zIndex: 10000,
        }}
      >
        Click ✕ to exit
      </div>
    </div>
  );
}
