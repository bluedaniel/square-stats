"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";

interface Props {
  onFile: (text: string, filename: string) => void;
}

export function CSVDropzone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const readFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => onFile(e.target?.result as string, file.name);
    reader.readAsText(file);
  };

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
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={onDrop}
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
