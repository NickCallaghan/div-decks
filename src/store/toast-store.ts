import { create } from "zustand";

export interface Toast {
  id: string;
  type: "success" | "error" | "info";
  message: string;
}

interface ToastState {
  toasts: Toast[];
  addToast: (type: Toast["type"], message: string) => void;
  removeToast: (id: string) => void;
}

const MAX_TOASTS = 3;

let nextId = 0;

export const useToastStore = create<ToastState>((set, get) => ({
  toasts: [],

  addToast: (type, message) => {
    const id = String(++nextId);
    const toast: Toast = { id, type, message };

    set((state) => {
      const toasts = [...state.toasts, toast];
      // Evict oldest if over cap
      if (toasts.length > MAX_TOASTS) {
        return { toasts: toasts.slice(toasts.length - MAX_TOASTS) };
      }
      return { toasts };
    });

    setTimeout(() => {
      get().removeToast(id);
    }, 5000);
  },

  removeToast: (id) => {
    set((state) => ({
      toasts: state.toasts.filter((t) => t.id !== id),
    }));
  },
}));
