import { useRef, useEffect, useCallback } from "react";
import type { SlideModel } from "../../types/presentation";
import { useEditorStore } from "../../store/editor-store";
import { EDITOR_BRIDGE_SCRIPT, EDITOR_OVERRIDE_CSS } from "../../lib/bridge";

interface SlideRendererProps {
  slide: SlideModel;
  head: string;
  interactive?: boolean;
}

export function SlideRenderer({
  slide,
  head,
  interactive = true,
}: SlideRendererProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const updateSlideHtml = useEditorStore((s) => s.updateSlideHtml);
  const setSelectedElement = useEditorStore((s) => s.setSelectedElement);
  const setIsEditing = useEditorStore((s) => s.setIsEditing);

  // Construct the single-slide HTML document
  const srcdoc = buildSlideSrcdoc(slide, head, interactive);

  const handleMessage = useCallback(
    (e: MessageEvent) => {
      if (e.source !== iframeRef.current?.contentWindow) return;
      const { data } = e;
      switch (data.type) {
        case "element-clicked":
          setSelectedElement({
            selector: data.selector,
            tagName: data.tagName,
            className: data.className,
            text: data.text,
            rect: data.rect,
          });
          break;
        case "dom-updated":
          updateSlideHtml(slide.id, data.outerHtml);
          break;
        case "editing-started":
          setIsEditing(true);
          break;
        case "editing-finished":
          setIsEditing(false);
          break;
        case "element-deselected":
          setSelectedElement(null);
          break;
      }
    },
    [slide.id, updateSlideHtml, setSelectedElement, setIsEditing],
  );

  useEffect(() => {
    if (!interactive) return;
    window.addEventListener("message", handleMessage);
    return () => window.removeEventListener("message", handleMessage);
  }, [handleMessage, interactive]);

  return (
    <iframe
      ref={iframeRef}
      className="editor-canvas__iframe"
      srcDoc={srcdoc}
      sandbox="allow-scripts allow-same-origin"
      title={`Slide ${slide.index + 1}`}
    />
  );
}

function buildSlideSrcdoc(
  slide: SlideModel,
  head: string,
  interactive: boolean,
): string {
  return `<!DOCTYPE html>
<html lang="en">
<head>
${head}
${EDITOR_OVERRIDE_CSS}
</head>
<body>
<div class="deck">
  ${slide.outerHtml}
</div>
${interactive ? EDITOR_BRIDGE_SCRIPT : ""}
</body>
</html>`;
}
