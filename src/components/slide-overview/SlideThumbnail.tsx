import type { SlideModel } from "../../types/presentation";
import { EDITOR_OVERRIDE_CSS } from "../../lib/bridge";

interface SlideThumbnailProps {
  slide: SlideModel;
  head: string;
  isActive: boolean;
  slideNumber: number;
  onClick: () => void;
}

export function SlideThumbnail({
  slide,
  head,
  isActive,
  slideNumber,
  onClick,
}: SlideThumbnailProps) {
  const srcdoc = `<!DOCTYPE html>
<html lang="en">
<head>
${head}
${EDITOR_OVERRIDE_CSS}
<style>
  /* Thumbnail-specific: no pointer events, no hover effects */
  * { pointer-events: none !important; }
  *:hover { outline: none !important; }
</style>
</head>
<body>
<div class="deck">
  ${slide.outerHtml}
</div>
</body>
</html>`;

  return (
    <div
      className={`slide-thumbnail ${isActive ? "slide-thumbnail--active" : ""}`}
      onClick={onClick}
    >
      <div className="slide-thumbnail__iframe-container">
        <iframe
          className="slide-thumbnail__iframe"
          srcDoc={srcdoc}
          sandbox="allow-same-origin"
          title={`Slide ${slideNumber}`}
          loading="lazy"
          tabIndex={-1}
          style={{ "--thumb-scale": 0.22 } as React.CSSProperties}
        />
      </div>
      <div className="slide-thumbnail__label">
        <span className="slide-thumbnail__number">{slideNumber}</span>
        <span className="slide-thumbnail__type">{slide.type}</span>
      </div>
    </div>
  );
}
