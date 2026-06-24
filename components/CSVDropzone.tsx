"use client";

import { useCallback, useState } from "react";
import { Card } from "@/components/ui/card";
import { Upload } from "lucide-react";

interface Props {
  onFile: (text: string, filename: string) => void;
}

export function CSVDropzone({ onFile }: Props) {
  const [dragging, setDragging] = useState(false);

  const readFiles = (files: FileList | File[]) => {
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => onFile(e.target?.result as string, file.name);
      reader.readAsText(file);
    });
  };

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    if (e.dataTransfer.files.length) readFiles(e.dataTransfer.files);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <Card
      className={[
        "max-w-sm mx-auto border-2 border-dashed transition-colors cursor-pointer",
        dragging ? "border-primary bg-primary/5" : "border-muted-foreground/30 hover:border-primary/60",
      ].join(" ")}
      onDragOver={e => { e.preventDefault(); setDragging(true); }}
      onDragLeave={() => setDragging(false)}
      onDrop={onDrop}
      onClick={() => document.getElementById("csv-input")?.click()}
    >
      <div className="flex flex-col items-center gap-3 p-12 text-center select-none">
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted">
          <Upload className="h-5 w-5 text-muted-foreground" />
        </div>
        <div>
          <p className="text-sm font-medium">Drop your CSV files here</p>
          <p className="text-xs text-muted-foreground mt-1">Square launch monitor export · multiple files supported</p>
        </div>
      </div>
      <input
        id="csv-input"
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={e => { if (e.target.files?.length) readFiles(e.target.files); }}
      />
    </Card>
  );
}
