"use client";

import { useCallback, useEffect, useState } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  onFile: (text: string, filename: string) => void;
}

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function CSVDropzone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

  useEffect(() => {
    if (!isTauri) return;

    let unlisten: (() => void) | undefined;
    let unlistenEnter: (() => void) | undefined;
    let unlistenLeave: (() => void) | undefined;

    (async () => {
      const { listen } = await import("@tauri-apps/api/event");
      const { invoke } = await import("@tauri-apps/api/core");

      unlistenEnter = await listen("tauri://drag-enter", () => setDragging(true));
      unlistenLeave = await listen("tauri://drag-leave", () => setDragging(false));
      unlisten = await listen<{ paths: string[] }>("tauri://drag-drop", async (event) => {
        setDragging(false);
        const path = event.payload.paths?.[0];
        if (!path) return;
        try {
          const text = await invoke<string>("read_file", { path });
          onFile(text, path.split("/").pop() ?? path);
        } catch (e) {
          console.error("Failed to read dropped file:", e);
        }
      });
    })();

    return () => {
      unlisten?.();
      unlistenEnter?.();
      unlistenLeave?.();
    };
  }, [onFile]);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) readFile(file);
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );

  return (
    <div className="flex items-center justify-center min-h-screen bg-background p-8">
      <Card
        className={`w-full max-w-lg border-2 border-dashed transition-colors cursor-pointer ${
          dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60"
        }`}
        onDragOver={isTauri ? undefined : (e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={isTauri ? undefined : () => setDragging(false)}
        onDrop={isTauri ? undefined : onDrop}
        onClick={() => document.getElementById("csv-input")?.click()}
      >
        <div className="flex flex-col items-center gap-4 p-12 text-center select-none">
          <div className="text-5xl">⛳</div>
          <div>
            <p className="text-xl font-semibold">Drop your Square Omni CSV here</p>
            <p className="text-sm text-muted-foreground mt-1">or click to browse</p>
          </div>
        </div>
        <input
          id="csv-input"
          type="file"
          accept=".csv"
          className="hidden"
          onChange={(e) => {
            const file = e.target.files?.[0];
            if (file) readFile(file);
          }}
        />
      </Card>
    </div>
  );
}
