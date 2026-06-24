"use client";

import { Dashboard } from "@/components/Dashboard";
import { NavBar } from "@/components/NavBar";
import { NoSessionState } from "@/components/EmptyState";
import { useSession } from "@/contexts/SessionContext";

export default function Home() {
  const { analysis, filename } = useSession();

  if (!analysis) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <div className="flex-1 overflow-hidden"><NoSessionState page="dashboard" /></div>
      </div>
    );
  }

  return <Dashboard analysis={analysis} filename={filename} />;
}
