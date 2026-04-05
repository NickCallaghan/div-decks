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
  const containerRef = useRef<HTMLDivElement>(null);
  const iframeRef = useRef<HTMLIFrameElement>(null);

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
        e.stopPropagation();
        onExitRef.current();
        return;
      }
      e.stopPropagation();
    }
    function handleMessage(e: MessageEvent) {
      if (e.data?.type === "exit-presentation") onExitRef.current();
    }
    window.addEventListener("keydown", handleKeyDown, true);
    window.addEventListener("message", handleMessage);
    return () => {
      window.removeEventListener("keydown", handleKeyDown, true);
      window.removeEventListener("message", handleMessage);
    };
  }, []);

  // Auto-focus container so Escape works before user clicks the iframe
  useEffect(() => {
    containerRef.current?.focus();
  }, []);

  // Attach a keydown listener directly on the iframe's contentDocument.
  // This is the most reliable path when the iframe has focus, since keyboard
  // events inside an iframe don't propagate to the parent window at all.
  // We try both immediately (srcdoc may already be parsed) and on load.
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    function attachEscapeToIframeDoc() {
      try {
        const doc = iframe!.contentDocument;
        if (!doc) return;
        doc.addEventListener("keydown", (e) => {
          if (e.key === "Escape") {
            e.preventDefault();
            onExitRef.current();
          }
        });
      } catch {
        // contentDocument not accessible — fall back to postMessage path
      }
    }

    // Try immediately in case srcdoc is already loaded
    attachEscapeToIframeDoc();
    // Also try on native load event (fires after srcdoc finishes parsing)
    iframe.addEventListener("load", attachEscapeToIframeDoc);

    return () => {
      iframe.removeEventListener("load", attachEscapeToIframeDoc);
    };
  }, []);

  // Fade hint after 3 seconds
  useEffect(() => {
    const timer = setTimeout(() => setShowHint(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  if (!presentation) return null;

  return (
    <div
      ref={containerRef}
      data-testid="presentation-mode"
      tabIndex={-1}
      onKeyDown={(e) => {
        if (e.key === "Escape") onExitRef.current();
      }}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#000",
        outline: "none",
      }}
    >
      <iframe
        ref={iframeRef}
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
        title="Exit presentation (Esc)"
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
