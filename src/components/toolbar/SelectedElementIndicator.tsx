import { Separator, ToolbarButton } from "./shared";

interface SelectedElementIndicatorProps {
  tagName: string;
  onDeselect: () => void;
}

export function SelectedElementIndicator({
  tagName,
  onDeselect,
}: SelectedElementIndicatorProps) {
  return (
    <>
      <span
        style={{
          fontSize: 11,
          color: "var(--color-blue-500)",
          display: "flex",
          alignItems: "center",
          gap: 4,
        }}
      >
        <span
          style={{
            padding: "2px 6px",
            background: "var(--color-blue-50)",
            borderRadius: 4,
            fontFamily: "monospace",
          }}
        >
          &lt;{tagName.toLowerCase()}&gt;
        </span>
      </span>
      <ToolbarButton onClick={onDeselect} title="Deselect (Esc)">
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </ToolbarButton>
      <Separator />
    </>
  );
}
