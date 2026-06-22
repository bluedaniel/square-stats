"use client";

import { useMemo, useState, useEffect } from "react";
import { NavBar } from "@/components/NavBar";
import { StatsCards } from "@/components/StatsCards";
import { DispersionChart } from "@/components/DispersionChart";
import { DistanceHistogram } from "@/components/DistanceHistogram";
import { TrendChart } from "@/components/TrendChart";
import { SpinChart } from "@/components/SpinChart";
import { SessionFaceToPath } from "@/components/SessionFaceToPath";
import { SessionImpactChart } from "@/components/SessionImpactChart";
import { SessionLoftDiagram } from "@/components/SessionLoftDiagram";
import { StatsTable } from "@/components/StatsTable";
import { recomputeClubStats } from "@/utils/analyze";
import { SessionMeta } from "@/components/SessionMeta";
import { Button } from "@/components/ui/button";
import type { SessionAnalysis } from "@/types/shot";

interface Props {
  analysis: SessionAnalysis;
  filename: string;
  onReset: () => void;
}

export function Dashboard({ analysis, filename, onReset }: Props) {
  const clubs = ["All", ...new Set(analysis.shots.map((s) => s.club))];
  const [selectedClub, setSelectedClub] = useState("All");
  const [hideOutliers, setHideOutliers] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("hideOutliers") === "true"
  );

  useEffect(() => {
    localStorage.setItem("hideOutliers", String(hideOutliers));
  }, [hideOutliers]);

  const visibleShots = useMemo(
    () =>
      hideOutliers
        ? analysis.shots.filter((_, i) => !analysis.outlierIndices.has(i))
        : analysis.shots,
    [hideOutliers, analysis]
  );

  const filteredShots = useMemo(
    () =>
      selectedClub === "All"
        ? visibleShots
        : visibleShots.filter((s) => s.club === selectedClub),
    [selectedClub, visibleShots]
  );

  const visibleClubStats = useMemo(
    () => recomputeClubStats(visibleShots),
    [visibleShots]
  );

  const outlierCount = analysis.outlierIndices.size;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar
        right={
          <Button onClick={onReset} variant="outline" size="sm">
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
            Load new file
          </Button>
        }
      />

      <div className="border-b px-6 py-2">
        <SessionMeta
          meta={analysis.meta}
          filename={filename}
          outlierCount={outlierCount}
          hideOutliers={hideOutliers}
          onToggleOutliers={setHideOutliers}
        />
      </div>

      <main className="p-6 space-y-6">
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 overflow-x-auto w-fit mx-auto">
          {clubs.map((club) => (
            <button
              key={club}
              onClick={() => setSelectedClub(club)}
              className={[
                "px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors select-none",
                club === selectedClub
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {club}
            </button>
          ))}
        </div>

        <StatsCards shots={filteredShots} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DispersionChart shots={filteredShots} poorContactShots={analysis.poorContactShots} />
          <DistanceHistogram shots={filteredShots} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart shots={filteredShots} />
          <SpinChart shots={filteredShots} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <SessionFaceToPath shots={filteredShots} club={selectedClub} />
          <SessionLoftDiagram shots={filteredShots} club={selectedClub} />
          <SessionImpactChart shots={filteredShots} club={selectedClub} />
        </div>

        <StatsTable clubStats={visibleClubStats} />
      </main>
    </div>
  );
}
