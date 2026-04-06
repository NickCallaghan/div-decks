export function Separator() {
  return (
    <div
      style={{
        width: 1,
        height: 24,
        background: "var(--color-gray-200)",
        margin: "0 6px",
        flexShrink: 0,
      }}
    />
  );
}

export function ToolbarButton({
  children,
  onClick,
  disabled,
  title,
  danger,
}: {
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
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        width: 30,
        height: 30,
        border: "none",
        background: "transparent",
        borderRadius: 6,
        cursor: disabled ? "default" : "pointer",
        color: disabled
          ? "var(--color-gray-300)"
          : danger
            ? "var(--color-red-500)"
            : "var(--color-gray-600)",
        transition: "background 0.15s, color 0.15s",
        flexShrink: 0,
      }}
    >
      {children}
    </button>
  );
}
