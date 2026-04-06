import { useEffect } from "react";
import { fetchPresentationList } from "../api/presentations";
import { useEditorStore } from "../store/editor-store";
import { useToastStore } from "../store/toast-store";

export function usePresentationList() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  useEffect(() => {
    fetchPresentationList()
      .then(setFiles)
      .catch(() =>
        useToastStore.getState().addToast("error", "Failed to load files"),
      );
  }, [setFiles]);

  const refresh = () => {
    fetchPresentationList()
      .then(setFiles)
      .catch(() =>
        useToastStore.getState().addToast("error", "Failed to refresh files"),
      );
  };

  return { files, refresh };
}
