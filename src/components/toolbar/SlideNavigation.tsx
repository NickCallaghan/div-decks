import { ToolbarButton } from "./shared";

interface SlideNavigationProps {
  activeSlideIndex: number;
  totalSlides: number;
  onPrev: () => void;
  onNext: () => void;
}

export function SlideNavigation({
  activeSlideIndex,
  totalSlides,
  onPrev,
  onNext,
}: SlideNavigationProps) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
      <ToolbarButton
        onClick={onPrev}
        disabled={activeSlideIndex === 0}
        title="Previous slide"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="15 18 9 12 15 6" />
        </svg>
      </ToolbarButton>
      <span
        style={{
          fontSize: 12,
          color: "var(--color-gray-500)",
          fontVariantNumeric: "tabular-nums",
          minWidth: 48,
          textAlign: "center",
        }}
      >
        {activeSlideIndex + 1} / {totalSlides}
      </span>
      <ToolbarButton
        onClick={onNext}
        disabled={activeSlideIndex >= totalSlides - 1}
        title="Next slide"
      >
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <polyline points="9 18 15 12 9 6" />
        </svg>
      </ToolbarButton>
    </div>
  );
}
