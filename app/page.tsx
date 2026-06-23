"use client";

import { useState } from "react";
import { CSVDropzone } from "@/components/CSVDropzone";
import { Dashboard } from "@/components/Dashboard";
import { useSession } from "@/contexts/SessionContext";
import { useLoadSession } from "@/hooks/useLoadSession";

export default function Home() {
  const { analysis, filename, sessions, removeSession, activeId } = useSession();
  const { loadFile } = useLoadSession();
  const [error, setError] = useState<string | null>(null);

  function handleFile(text: string, name: string) {
    try {
      setError(null);
      loadFile(text, name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }

  if (sessions.length > 0 && analysis) {
    return (
      <Dashboard analysis={analysis} filename={filename} />
    );
  }

  return (
    <div>
      <CSVDropzone onFile={handleFile} />
      {error && (
        <p className="fixed bottom-6 left-1/2 -translate-x-1/2 bg-destructive text-destructive-foreground text-sm px-4 py-2 rounded shadow">
          {error}
        </p>
      )}
    </div>
  );
}
