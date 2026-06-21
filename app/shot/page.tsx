"use client";

import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ImpactChart } from "@/components/ImpactChart";
import { LoftDiagram } from "@/components/LoftDiagram";
import { FaceToPath } from "@/components/FaceToPath";
import { useSession } from "@/contexts/SessionContext";
import type { Shot } from "@/types/shot";

function fmtDir(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}`;
}


function fmt(n: number, d = 1, unit = ""): string {
  const val = n === 0 ? "0" : n.toFixed(d);
  return unit ? `${val} ${unit}` : val;
}

interface StatRowProps {
  label: string;
  value: string;
  sub?: string;
}

function Stat({ label, value, sub }: StatRowProps) {
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs text-muted-foreground uppercase tracking-wide">
        {label}
      </span>
      <span className="text-xl font-semibold tabular-nums">{value}</span>
      {sub && <span className="text-xs text-muted-foreground">{sub}</span>}
    </div>
  );
}

interface GroupProps {
  title: string;
  stats: StatRowProps[];
  cols?: number;
}

function StatGroup({ title, stats, cols = 3 }: GroupProps) {
  const gridClass =
    cols === 2
      ? "grid-cols-2"
      : cols === 4
        ? "grid-cols-2 sm:grid-cols-4"
        : "grid-cols-2 sm:grid-cols-3";
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
          {title}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className={`grid ${gridClass} gap-x-6 gap-y-5`}>
          {stats.map((s) => (
            <Stat key={s.label} {...s} />
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

function buildGroups(shot: Shot) {
  return [
    {
      title: "Distance",
      cols: 4 as const,
      stats: [
        { label: "Carry", value: fmt(shot.carry, 1, "yd") },
        { label: "Total", value: fmt(shot.total, 1, "yd") },
        { label: "Apex", value: fmt(shot.apex, 1, "yd") },
        { label: "Offline", value: fmtDir(shot.offline) + " yd" },
      ],
    },
    {
      title: "Speed & Contact",
      cols: 3 as const,
      stats: [
        { label: "Ball Speed", value: fmt(shot.ballSpeed, 1, "mph") },
        {
          label: "Club Speed",
          value: shot.clubSpeed ? fmt(shot.clubSpeed, 1, "mph") : "—",
        },
        {
          label: "Smash Factor",
          value: shot.smashFactor ? fmt(shot.smashFactor, 2) : "—",
        },
      ],
    },
    {
      title: "Launch",
      cols: 3 as const,
      stats: [
        { label: "Launch Angle", value: fmt(shot.launchAngle, 1, "°") },
        {
          label: "Launch Direction",
          value: fmtDir(shot.launchDirection) + "°",
        },
        { label: "Landing Angle", value: fmt(shot.landingAngle, 1, "°") },
      ],
    },
    {
      title: "Spin",
      cols: 4 as const,
      stats: [
        {
          label: "Spin Rate",
          value: shot.spinRate ? fmt(shot.spinRate, 0, "rpm") : "—",
        },
        { label: "Spin Axis", value: fmtDir(shot.spinAxis) + "°" },
        { label: "Back Spin", value: fmt(shot.backSpin, 0, "rpm") },
        { label: "Side Spin", value: fmtDir(shot.sideSpin) + " rpm" },
      ],
    },
    {
      title: "Club Data",
      cols: 4 as const,
      stats: [
        { label: "Club Path", value: fmtDir(shot.clubPath) + "°" },
        { label: "Face Angle", value: fmtDir(shot.faceAngle) + "°" },
        { label: "Attack Angle", value: fmt(shot.attackAngle, 1, "°") },
        { label: "Dynamic Loft", value: fmt(shot.dynamicLoft, 1, "°") },
      ],
    },
  ];
}

export default function ShotPage() {
  const { selectedShot, analysis } = useSession();

  if (!selectedShot || !analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No shot selected.</p>
          <Link href="/shots" className="text-sm underline">
            Back to shots
          </Link>
        </div>
      </div>
    );
  }

  const shot = selectedShot;
  const arrayIdx = analysis.shots.indexOf(shot);
  const isOutlier = analysis.outlierIndices.has(arrayIdx);
  const isPoorContact = analysis.poorContactShots.has(shot.index);
  const groups = buildGroups(shot);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Link
            href="/shots"
            className="text-muted-foreground hover:text-foreground text-sm"
          >
            ← All shots
          </Link>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-xl font-bold">
                {shot.club} · Shot #{shot.index}
              </h1>
              {isOutlier && (
                <Badge variant="outline" className="text-xs">
                  Outlier
                </Badge>
              )}
              {isPoorContact && !isOutlier && (
                <Badge variant="outline" className="text-xs">
                  Poor contact
                </Badge>
              )}
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              {analysis.meta.date && analysis.meta.date}
              {analysis.meta.place && ` · ${analysis.meta.place}`}
            </p>
          </div>
        </div>
      </header>

      <main className="p-6">
        <div className="flex gap-4 max-w-6xl items-start">
          {/* Left: SVG diagrams */}
          <div className="flex flex-col gap-4 w-80 shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Face to Path
                </CardTitle>
              </CardHeader>
              <CardContent>
                <FaceToPath
                  launchDirection={shot.launchDirection}
                  faceAngle={shot.faceAngle}
                  clubPath={shot.clubPath}
                  club={shot.club}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Dynamic Loft
                </CardTitle>
              </CardHeader>
              <CardContent>
                <LoftDiagram
                  launchAngle={shot.launchAngle}
                  dynamicLoft={shot.dynamicLoft}
                  attackAngle={shot.attackAngle}
                  club={shot.club}
                />
              </CardContent>
            </Card>
          </div>

          {/* Centre: stat groups */}
          <div className="flex flex-col gap-4 flex-1 min-w-0">
            {groups.map((g) => (
              <StatGroup key={g.title} title={g.title} stats={g.stats} cols={g.cols} />
            ))}
          </div>

          {/* Right: impact location */}
          <div className="w-64 shrink-0">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-wide">
                  Impact Location
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <ImpactChart
                  horizontal={shot.impactHorizontal}
                  vertical={shot.impactVertical}
                  club={shot.club}
                />
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
}
