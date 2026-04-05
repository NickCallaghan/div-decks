import { useEffect, useState, useMemo } from "react";
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
    const escapeScript = `
<script>
document.addEventListener('keydown', function(e) {
  if (e.key === 'Escape') {
    e.preventDefault();
    parent.postMessage({ type: 'exit-presentation' }, '*');
  }
});
</script>`;
    return html.replace("</body>", startScript + escapeScript + "\n</body>");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Suppress parent keyboard handlers and listen for escape from iframe
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") {
        onExit();
        return;
      }
      e.stopPropagation();
    }
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "exit-presentation") onExit();
    }
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("message", handleMessage);
    };
  }, [onExit]);

  // Fade hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!presentation) return null;

  return (
    <div
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
        Press{" "}
        <kbd
          style={{
            padding: "1px 6px",
            background: "rgba(255,255,255,0.15)",
            borderRadius: 4,
            border: "1px solid rgba(255,255,255,0.2)",
            fontSize: 12,
          }}
        >
          Esc
        </kbd>{" "}
        to exit
      </div>
    </div>
  );
}
