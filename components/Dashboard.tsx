"use client";

import { useMemo, useState } from "react";
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
import { ClubSelector } from "@/components/ClubSelector";
import { useSession } from "@/contexts/SessionContext";
import type { SessionAnalysis } from "@/types/shot";

interface Props {
  analysis: SessionAnalysis;
  filename: string;
}

export function Dashboard({ analysis, filename }: Props) {
  const { hideOutliers } = useSession();
  const clubs = ["All", ...new Set(analysis.shots.map((s) => s.club))];
  const [selectedClub, setSelectedClub] = useState("All");

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
      <NavBar />

      <div className="border-b px-6 py-2">
        <SessionMeta
          meta={analysis.meta}
          filename={filename}
          outlierCount={outlierCount}
        />
      </div>

      <main className="p-6 space-y-6">
        <ClubSelector clubs={clubs} selected={selectedClub} onChange={setSelectedClub} />

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
