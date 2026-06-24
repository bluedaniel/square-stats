"use client";

import { createContext, useContext, useState, useEffect } from "react";
import type { SessionAnalysis, Shot } from "@/types/shot";

export interface Session {
  id: string;
  filename: string;
  analysis: SessionAnalysis;
}

interface SessionContextValue {
  sessions: Session[];
  activeId: string | null;
  analysis: SessionAnalysis | null;
  filename: string;
  selectedShot: Shot | null;
  hideOutliers: boolean;
  setHideOutliers: (v: boolean) => void;
  addSession: (filename: string, analysis: SessionAnalysis) => void;
  setActiveId: (id: string) => void;
  removeSession: (id: string) => void;
  setSelectedShot: (s: Shot | null) => void;
  // legacy — kept for existing callers
  setAnalysis: (a: SessionAnalysis | null) => void;
  setFilename: (f: string) => void;
}

const SessionContext = createContext<SessionContextValue>({
  sessions: [],
  activeId: null,
  analysis: null,
  filename: "",
  selectedShot: null,
  hideOutliers: false,
  setHideOutliers: () => {},
  addSession: () => {},
  setActiveId: () => {},
  removeSession: () => {},
  setSelectedShot: () => {},
  setAnalysis: () => {},
  setFilename: () => {},
});

export function SessionProvider({ children }: { children: React.ReactNode }) {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeId, setActiveIdRaw] = useState<string | null>(null);
  const [selectedShot, setSelectedShot] = useState<Shot | null>(null);
  const [hideOutliers, setHideOutliersRaw] = useState(
    () => typeof window !== "undefined" && localStorage.getItem("hideOutliers") === "true"
  );

  function setHideOutliers(v: boolean) {
    setHideOutliersRaw(v);
    localStorage.setItem("hideOutliers", String(v));
  }

  const activeSession = sessions.find((s) => s.id === activeId) ?? null;

  function addSession(filename: string, analysis: SessionAnalysis) {
    const id = crypto.randomUUID();
    setSessions((prev) => [...prev, { id, filename, analysis }]);
    setActiveIdRaw(id);
    setSelectedShot(null);
  }

  function setActiveId(id: string) {
    setActiveIdRaw(id);
    setSelectedShot(null);
  }

  function removeSession(id: string) {
    setSessions((prev) => {
      const next = prev.filter((s) => s.id !== id);
      if (activeId === id) {
        setActiveIdRaw(next.length > 0 ? next[next.length - 1].id : null);
        setSelectedShot(null);
      }
      return next;
    });
  }

  // Legacy setAnalysis: null clears all; non-null replaces active or creates first session
  function setAnalysis(a: SessionAnalysis | null) {
    if (a === null) {
      setSessions([]);
      setActiveIdRaw(null);
      setSelectedShot(null);
    } else if (activeSession) {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, analysis: a } : s)));
    } else {
      const id = crypto.randomUUID();
      setSessions([{ id, filename: "", analysis: a }]);
      setActiveIdRaw(id);
    }
  }

  function setFilename(f: string) {
    if (activeId) {
      setSessions((prev) => prev.map((s) => (s.id === activeId ? { ...s, filename: f } : s)));
    }
  }

  return (
    <SessionContext.Provider
      value={{
        sessions,
        activeId,
        analysis: activeSession?.analysis ?? null,
        filename: activeSession?.filename ?? "",
        selectedShot,
        hideOutliers,
        setHideOutliers,
        addSession,
        setActiveId,
        removeSession,
        setSelectedShot,
        setAnalysis,
        setFilename,
      }}
    >
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  return useContext(SessionContext);
}
