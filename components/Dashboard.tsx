"use client";

import { useMemo, useState, useEffect } from "react";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/NavBar";
import { StatsCards } from "@/components/StatsCards";
import { DispersionChart } from "@/components/DispersionChart";
import { DistanceHistogram } from "@/components/DistanceHistogram";
import { TrendChart } from "@/components/TrendChart";
import { SpinChart } from "@/components/SpinChart";
import { StatsTable } from "@/components/StatsTable";
import { recomputeClubStats } from "@/utils/analyze";
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
          <button
            onClick={onReset}
            className="text-xs text-muted-foreground hover:text-foreground"
          >
            Load new file
          </button>
        }
      />

      <div className="border-b px-6 py-2 flex items-center justify-between gap-4">
        <p className="text-xs text-muted-foreground shrink-0">
          {analysis.meta.date}
          {analysis.meta.place && ` · ${analysis.meta.place}`}
          {" · "}
          <span className="italic">{filename}</span>
        </p>
        <div className="flex flex-wrap gap-1.5 items-center justify-end">
          {clubs.map((club) => (
            <Badge
              key={club}
              variant={club === selectedClub ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setSelectedClub(club)}
            >
              {club}
            </Badge>
          ))}
          <div className="w-px h-4 bg-border mx-0.5" />
          <Badge
            variant={hideOutliers ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setHideOutliers((v) => !v)}
          >
            {hideOutliers ? `Outliers hidden (${outlierCount})` : `Hide outliers (${outlierCount})`}
          </Badge>
        </div>
      </div>

      <main className="p-6 space-y-6">
        <StatsCards shots={filteredShots} />

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <DispersionChart shots={filteredShots} poorContactShots={analysis.poorContactShots} />
          <DistanceHistogram shots={filteredShots} />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <TrendChart shots={filteredShots} />
          <SpinChart shots={filteredShots} />
        </div>

        <StatsTable clubStats={visibleClubStats} />
      </main>
    </div>
  );
}
