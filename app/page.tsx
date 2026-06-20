"use client";

import { useState } from "react";
import { CSVDropzone } from "@/components/CSVDropzone";
import { Dashboard } from "@/components/Dashboard";
import { parseSquareOmniCSV } from "@/utils/parseCSV";
import { analyze } from "@/utils/analyze";
import { useSession } from "@/contexts/SessionContext";

export default function Home() {
  const { analysis, filename, setAnalysis, setFilename } = useSession();
  const [error, setError] = useState<string | null>(null);

  function handleFile(text: string, name: string) {
    try {
      setError(null);
      const { meta, shots } = parseSquareOmniCSV(text);
      if (!shots.length) throw new Error("No shots found in CSV");
      setAnalysis(analyze(meta, shots));
      setFilename(name);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to parse CSV");
    }
  }

  if (analysis) {
    return (
      <Dashboard
        analysis={analysis}
        filename={filename}
        onReset={() => { setAnalysis(null); setFilename(""); }}
      />
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
