"use client";

import { useSession } from "@/contexts/SessionContext";
import { parseSquareCSV } from "@/utils/parseCSV";
import { analyze } from "@/utils/analyze";

export function useLoadSession() {
  const { addSession } = useSession();

  function loadFile(text: string, name: string) {
    const { meta, shots } = parseSquareCSV(text);
    if (!shots.length) throw new Error("No shots found in CSV");
    addSession(name, analyze(meta, shots));
  }

  return { loadFile };
}
