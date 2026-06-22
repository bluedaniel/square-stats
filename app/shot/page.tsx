"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { NavBar } from "@/components/NavBar";
import { ImpactChart } from "@/components/ImpactChart";
import { LoftDiagram } from "@/components/LoftDiagram";
import { FaceToPath } from "@/components/FaceToPath";
import { LandingChart } from "@/components/LandingChart";
import { useRouter } from "next/navigation";
import { useSession } from "@/contexts/SessionContext";
import { loadProfile, findBagClub, profileStatStatus, csvToLabel, type BagClub } from "@/lib/profile";
import { IdealsViewModal } from "@/components/IdealsViewModal";
import type { Shot } from "@/types/shot";

type HighlightMode = "off" | "positive" | "negative" | "both";

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
  status?: "good" | "bad";
  ideal?: { min?: number; max?: number };
}

function idealText(ideal: StatRowProps["ideal"]): string | undefined {
  if (!ideal) return undefined;
  if (ideal.min != null && ideal.max != null) return `${ideal.min} – ${ideal.max}`;
  if (ideal.min != null) return `≥ ${ideal.min}`;
  if (ideal.max != null) return `≤ ${ideal.max}`;
  return undefined;
}

function Stat({ label, value, sub, status, ideal, highlightMode }: StatRowProps & { highlightMode: HighlightMode }) {
  const showGood = status === "good" && (highlightMode === "positive" || highlightMode === "both");
  const showBad  = status === "bad"  && (highlightMode === "negative" || highlightMode === "both");
  const hint = idealText(ideal);
  return (
    <div className="relative group">
      <Card className={[
        "aspect-square flex flex-col items-center justify-center text-center p-3 gap-1 max-w-32",
        showGood ? "ring-2 ring-green-500" : "",
        showBad  ? "ring-2 ring-red-500"   : "",
      ].join(" ")}>
        <span className="text-[10px] font-medium text-muted-foreground uppercase tracking-wide leading-tight">
          {label}
        </span>
        <span className="text-lg font-semibold tabular-nums leading-tight">
          {value}
        </span>
        {sub && <span className="text-[10px] text-muted-foreground">{sub}</span>}
      </Card>
      {hint && (
        <div className="pointer-events-none absolute bottom-full left-1/2 -translate-x-1/2 mb-1.5 px-2 py-1 rounded bg-popover border border-border text-xs whitespace-nowrap shadow-sm opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {hint}
        </div>
      )}
    </div>
  );
}

interface GroupProps {
  title: string;
  stats: StatRowProps[];
  cols?: number;
  highlightMode: HighlightMode;
}

function StatGroup({ title, stats, cols = 3, highlightMode }: GroupProps) {
  const gridClass =
    cols === 2 ? "grid-cols-2" :
    cols === 4 ? "grid-cols-2 sm:grid-cols-4" :
                 "grid-cols-2 sm:grid-cols-3";
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide mb-2 px-0.5">
        {title}
      </p>
      <div className={`grid ${gridClass} gap-2 lg:gap-3`}>
        {stats.map((s) => (
          <Stat key={s.label} {...s} highlightMode={highlightMode} />
        ))}
      </div>
    </div>
  );
}

function buildGroups(shot: Shot, bagClub: BagClub | undefined) {
  const s = (key: Parameters<typeof profileStatStatus>[1], val: number | undefined | null) =>
    profileStatStatus(bagClub, key, val);
  const i = (key: Parameters<typeof profileStatStatus>[1]) => bagClub?.ideals[key];

  return [
    {
      title: "Distance",
      cols: 4 as const,
      stats: [
        { label: "Carry",   value: fmt(shot.carry, 1, "yd"),       status: s("carry",   shot.carry),   ideal: i("carry")   },
        { label: "Total",   value: fmt(shot.total, 1, "yd"),        status: s("total",   shot.total),   ideal: i("total")   },
        { label: "Apex",    value: fmt(shot.apex, 1, "yd"),         status: s("apex",    shot.apex),    ideal: i("apex")    },
        { label: "Offline", value: fmtDir(shot.offline) + " yd",   status: s("offline", shot.offline), ideal: i("offline") },
      ],
    },
    {
      title: "Speed & Contact",
      cols: 4 as const,
      stats: [
        { label: "Ball Speed",   value: fmt(shot.ballSpeed, 1, "mph"),                       status: s("ballSpeed",   shot.ballSpeed),   ideal: i("ballSpeed")   },
        { label: "Club Speed",   value: shot.clubSpeed   ? fmt(shot.clubSpeed, 1, "mph") : "—", status: s("clubSpeed",   shot.clubSpeed),   ideal: i("clubSpeed")   },
        { label: "Smash Factor", value: shot.smashFactor ? fmt(shot.smashFactor, 2)      : "—", status: s("smashFactor", shot.smashFactor), ideal: i("smashFactor") },
      ],
    },
    {
      title: "Launch",
      cols: 4 as const,
      stats: [
        { label: "Launch Angle",     value: fmt(shot.launchAngle, 1, "°"),      status: s("launchAngle",     shot.launchAngle),     ideal: i("launchAngle")     },
        { label: "Launch Direction", value: fmtDir(shot.launchDirection) + "°", status: s("launchDirection", shot.launchDirection), ideal: i("launchDirection") },
        { label: "Landing Angle",    value: fmt(shot.landingAngle, 1, "°"),     status: s("landingAngle",    shot.landingAngle),    ideal: i("landingAngle")    },
      ],
    },
    {
      title: "Spin",
      cols: 4 as const,
      stats: [
        { label: "Spin Rate", value: shot.spinRate ? fmt(shot.spinRate, 0, "rpm") : "—", status: s("spinRate", shot.spinRate), ideal: i("spinRate") },
        { label: "Spin Axis", value: fmtDir(shot.spinAxis) + "°",    status: s("spinAxis", shot.spinAxis), ideal: i("spinAxis") },
        { label: "Back Spin", value: fmt(shot.backSpin, 0, "rpm"),   status: s("backSpin", shot.backSpin), ideal: i("backSpin") },
        { label: "Side Spin", value: fmtDir(shot.sideSpin) + " rpm", status: s("sideSpin", shot.sideSpin), ideal: i("sideSpin") },
      ],
    },
    {
      title: "Club Data",
      cols: 4 as const,
      stats: [
        { label: "Club Path",    value: fmtDir(shot.clubPath) + "°",   status: s("clubPath",    shot.clubPath),    ideal: i("clubPath")    },
        { label: "Face Angle",   value: fmtDir(shot.faceAngle) + "°",  status: s("faceAngle",   shot.faceAngle),   ideal: i("faceAngle")   },
        { label: "Attack Angle", value: fmt(shot.attackAngle, 1, "°"), status: s("attackAngle", shot.attackAngle), ideal: i("attackAngle") },
        { label: "Dynamic Loft", value: fmt(shot.dynamicLoft, 1, "°"), status: s("dynamicLoft", shot.dynamicLoft), ideal: i("dynamicLoft") },
      ],
    },
  ];
}

export default function ShotPage() {
  const { selectedShot, analysis } = useSession();
  const router = useRouter();
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(() =>
    (localStorage.getItem("highlightMode") as HighlightMode) ?? "off"
  );
  const [profile] = useState(() => loadProfile());
  const [idealsViewOpen, setIdealsViewOpen] = useState(false);

  const CYCLE: HighlightMode[] = ["off", "positive", "negative", "both"];
  function cycleHighlight() {
    const next = CYCLE[(CYCLE.indexOf(highlightMode) + 1) % CYCLE.length];
    setHighlightMode(next);
    localStorage.setItem("highlightMode", next);
  }

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
  const bagClub = findBagClub(shot.club, profile.bag);
  const groups = buildGroups(shot, bagClub);
  const hideOutliers =
    typeof window !== "undefined" &&
    localStorage.getItem("hideOutliers") === "true";
  const clubShots = analysis.shots.filter(
    (s, i) =>
      s.club === shot.club && !(hideOutliers && analysis.outlierIndices.has(i)),
  );

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="border-b px-6 py-2 flex items-center gap-3">
        <h1 className="text-sm font-semibold">
          {shot.club} · Shot #{shot.index}
        </h1>
        {isOutlier && <Badge variant="outline" className="text-xs">Outlier</Badge>}
        {isPoorContact && !isOutlier && <Badge variant="outline" className="text-xs">Poor contact</Badge>}
        <span className="text-xs text-muted-foreground">
          {analysis.meta.date}
          {analysis.meta.place && ` · ${analysis.meta.place}`}
        </span>
      </div>

      <main className="p-6">
        <div className="grid gap-4 lg:gap-6 xl:gap-8 items-start grid-cols-1 lg:grid-cols-[260px_minmax(0,480px)] xl:grid-cols-[260px_minmax(0,480px)_220px] mx-auto w-fit">
          <div className="flex flex-col gap-4">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-normal">
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
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-normal">
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

            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground uppercase tracking-normal">
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

          <div className="flex flex-col gap-4 lg:gap-6">
            {bagClub ? (
              <div className="flex items-center gap-2">
                <span className="text-xs text-muted-foreground">Highlight ideals:</span>
                <button onClick={cycleHighlight} className={[
                  "px-3 py-1 rounded border text-xs font-medium",
                  highlightMode === "positive" ? "bg-green-500 text-white border-green-500" :
                  highlightMode === "negative" ? "bg-red-500 text-white border-red-500" :
                  highlightMode === "both"     ? "bg-primary text-primary-foreground border-primary" :
                  "text-muted-foreground border-border",
                ].join(" ")}>
                  {highlightMode === "off"      ? "Off" :
                   highlightMode === "positive" ? "Positive" :
                   highlightMode === "negative" ? "Negative" :
                                                  "Both"}
                </button>
                <button
                  onClick={() => setIdealsViewOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  · {bagClub.label} ideals
                </button>
              </div>
            ) : (
              <button
                onClick={() => router.push(`/profile?addClub=${encodeURIComponent(shot.club)}`)}
                className="text-xs text-muted-foreground hover:text-foreground underline"
              >
                Add {csvToLabel(shot.club)} to profile to highlight ideals
              </button>
            )}
            {groups.map((g) => (
              <StatGroup
                key={g.title}
                title={g.title}
                stats={g.stats}
                cols={g.cols}
                highlightMode={highlightMode}
              />
            ))}
          </div>

          <div>
            <LandingChart shots={clubShots} currentShot={shot} />
          </div>
        </div>
      </main>

      <IdealsViewModal club={idealsViewOpen ? bagClub ?? null : null} onClose={() => setIdealsViewOpen(false)} />
    </div>
  );
}
