"use client";

import { createContext, useContext, useState } from "react";
import type { SessionAnalysis, Shot } from "@/types/shot";

interface SessionContextValue {
  analysis: SessionAnalysis | null;
  filename: string;
  selectedShot: Shot | null;
  setAnalysis: (a: SessionAnalysis | null) => void;
  setFilename: (f: string) => void;
  setSelectedShot: (s: Shot | null) => void;
}

const SessionContext = createContext<SessionContextValue>({
  analysis: null,
  filename: "",
  selectedShot: null,
  setAnalysis: () => {},
  setFilename: () => {},
  setSelectedShot: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [analysis, setAnalysis] = useState<SessionAnalysis | null>(null);
  const [filename, setFilename] = useState("");
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  return (
    <SessionContext.Provider value={{ analysis, filename, selectedShot, setAnalysis, setFilename, setSelectedShot }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
