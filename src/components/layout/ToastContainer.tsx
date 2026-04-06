import { useToastStore, type Toast } from "../../store/toast-store";

export function ToastContainer() {
  const toasts = useToastStore((s) => s.toasts);
  const removeToast = useToastStore((s) => s.removeToast);

  if (toasts.length === 0) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 16,
        right: 16,
        zIndex: 9998,
        display: "flex",
        flexDirection: "column",
        gap: 8,
        pointerEvents: "none",
      }}
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onDismiss={removeToast} />
      ))}
    </div>
  );
}

function ToastItem({
  toast,
  onDismiss,
}: {
  toast: Toast;
  onDismiss: (id: string) => void;
}) {
  const colors = toastColors[toast.type];

  return (
    <div
      data-testid="toast"
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        padding: "10px 14px",
        borderRadius: 8,
        background: colors.bg,
        color: colors.text,
        border: `1px solid ${colors.border}`,
        fontSize: 13,
        fontWeight: 500,
        boxShadow: "0 4px 12px rgba(0,0,0,0.08)",
        pointerEvents: "auto",
        minWidth: 200,
        maxWidth: 360,
      }}
    >
      <span style={{ flexShrink: 0 }}>{colors.icon}</span>
      <span style={{ flex: 1 }}>{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          width: 20,
          height: 20,
          border: "none",
          background: "transparent",
          cursor: "pointer",
          color: colors.text,
          opacity: 0.6,
          flexShrink: 0,
          padding: 0,
        }}
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <line x1="18" y1="6" x2="6" y2="18" />
          <line x1="6" y1="6" x2="18" y2="18" />
        </svg>
      </button>
    </div>
  );
}

const toastColors = {
  success: {
    bg: "var(--color-green-50)",
    text: "var(--color-green-700)",
    border: "var(--color-green-200)",
    icon: "\u2713",
  },
  error: {
    bg: "var(--color-red-50)",
    text: "var(--color-red-700)",
    border: "var(--color-red-200)",
    icon: "\u2717",
  },
  info: {
    bg: "var(--color-blue-50)",
    text: "var(--color-blue-700)",
    border: "var(--color-blue-200)",
    icon: "\u2139",
  },
};
