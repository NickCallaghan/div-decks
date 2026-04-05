import { useEffect } from "react";
import { fetchPresentationList } from "../api/presentations";
import { useEditorStore } from "../store/editor-store";

export function usePresentationList() {
  const files = useEditorStore((s) => s.files);
  const setFiles = useEditorStore((s) => s.setFiles);

  useEffect(() => {
    fetchPresentationList()
      .then(setFiles)
      .catch((err) => console.error("Failed to load presentations:", err));
  }, [setFiles]);

  const refresh = () => {
    fetchPresentationList().then(setFiles).catch(console.error);
  };

  return { files, refresh };
}
