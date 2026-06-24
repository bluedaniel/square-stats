"use client";

import { useEffect } from "react";
import { syncProfileFromTauri } from "@/lib/profile";
import { useLoadSession } from "@/hooks/useLoadSession";

export function TauriInit() {
  const { loadFile } = useLoadSession();

  useEffect(() => {
    syncProfileFromTauri();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined" || !("__TAURI_INTERNALS__" in window)) return;

    let unlisten: (() => void) | undefined;
    let unlistenEnter: (() => void) | undefined;
    let unlistenLeave: (() => void) | undefined;

    (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const { invoke } = await import("@tauri-apps/api/core");

      unlistenEnter = await listen("tauri://drag-enter", () => {
        document.documentElement.setAttribute("data-tauri-drag", "true");
      });
      unlistenLeave = await listen("tauri://drag-leave", () => {
        document.documentElement.removeAttribute("data-tauri-drag");
      });
      unlisten = await listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
        document.documentElement.removeAttribute("data-tauri-drag");
        for (const path of event.payload.paths ?? []) {
          try {
            const text = await invoke<string>("read_file", { path });
            loadFile(text, path.split("/").pop() ?? path);
          } catch (e) {
            console.error("Failed to read dropped file:", e);
          }
        }
      });
    })();

    return () => { unlisten?.(); unlistenEnter?.(); unlistenLeave?.(); };
  }, [loadFile]);

  return null;
}
