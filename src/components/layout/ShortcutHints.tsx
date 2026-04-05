interface ShortcutHintsProps {
  onClose: () => void;
}

const shortcuts = [
  { keys: ["Cmd", "S"], action: "Save presentation" },
  { keys: ["Cmd", "Z"], action: "Undo" },
  { keys: ["Cmd", "Shift", "Z"], action: "Redo" },
  { keys: ["Cmd", "I"], action: "Toggle this panel" },
  { keys: ["←", "→"], action: "Navigate slides" },
  { keys: ["Esc"], action: "Deselect / exit edit mode" },
  { keys: ["Del"], action: "Delete selected element" },
  { keys: ["Click"], action: "Select element" },
  { keys: ["Click", "(selected)"], action: "Edit text" },
];

export function ShortcutHints({ onClose }: ShortcutHintsProps) {
  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 1000,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        background: "rgba(0, 0, 0, 0.4)",
        backdropFilter: "blur(4px)",
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div
        style={{
          background: "white",
          borderRadius: 12,
          padding: "24px 32px",
          minWidth: 380,
          maxWidth: 480,
          boxShadow: "0 20px 60px rgba(0, 0, 0, 0.2)",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <h2 style={{ fontSize: 16, fontWeight: 600, color: "#111" }}>
            Keyboard Shortcuts
          </h2>
          <button
            onClick={onClose}
            style={{
              border: "none",
              background: "transparent",
              cursor: "pointer",
              color: "#999",
              fontSize: 18,
              lineHeight: 1,
              padding: 4,
            }}
          >
            &times;
          </button>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
          {shortcuts.map((s, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: 16,
              }}
            >
              <span style={{ fontSize: 13, color: "#555" }}>{s.action}</span>
              <div style={{ display: "flex", gap: 4 }}>
                {s.keys.map((key, j) => (
                  <kbd
                    key={j}
                    style={{
                      display: "inline-block",
                      padding: "2px 8px",
                      fontSize: 12,
                      fontFamily: "system-ui, sans-serif",
                      fontWeight: 500,
                      color: "#444",
                      background: "#f5f5f5",
                      border: "1px solid #ddd",
                      borderRadius: 5,
                      boxShadow: "0 1px 0 #ccc",
                      lineHeight: "20px",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {key}
                  </kbd>
                ))}
              </div>
            </div>
          ))}
        </div>
        <div
          style={{
            marginTop: 20,
            fontSize: 12,
            color: "#999",
            textAlign: "center",
          }}
        >
          Press{" "}
          <kbd
            style={{
              padding: "1px 5px",
              fontSize: 11,
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            Cmd+I
          </kbd>{" "}
          or{" "}
          <kbd
            style={{
              padding: "1px 5px",
              fontSize: 11,
              background: "#f5f5f5",
              border: "1px solid #ddd",
              borderRadius: 4,
            }}
          >
            Esc
          </kbd>{" "}
          to close
        </div>
      </div>
    </div>
  );
}
