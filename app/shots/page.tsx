"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { useSession } from "@/contexts/SessionContext";
import { loadProfile, findBagClub, profileStatStatus, type ClubStatKey } from "@/lib/profile";
import type { Shot } from "@/types/shot";

type HighlightMode = "off" | "positive" | "negative" | "both";

type SortDir = "asc" | "desc";
type ShotKey = keyof Shot & string;

function fmtDir(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}`;
}

function fmtImpact(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "T" : "H"}${Math.abs(n).toFixed(1)}`;
}

function fmt(n: number, d = 1): string {
  return n === 0 ? "0" : n.toFixed(d);
}

interface Column {
  key: ShotKey;
  label: string;
  render: (s: Shot) => string;
  statKey?: ClubStatKey;
}

const COLUMNS: Column[] = [
  { key: "club",            label: "Club",         render: s => s.club },
  { key: "index",           label: "#",            render: s => String(s.index) },
  { key: "carry",           label: "Carry (yd)",   render: s => fmt(s.carry),               statKey: "carry" },
  { key: "total",           label: "Total (yd)",   render: s => fmt(s.total),               statKey: "total" },
  { key: "offline",         label: "Offline (yd)", render: s => fmtDir(s.offline),          statKey: "offline" },
  { key: "ballSpeed",       label: "Ball Spd",     render: s => fmt(s.ballSpeed),           statKey: "ballSpeed" },
  { key: "clubSpeed",       label: "Club Spd",     render: s => s.clubSpeed ? fmt(s.clubSpeed) : "—", statKey: "clubSpeed" },
  { key: "smashFactor",     label: "Smash",        render: s => s.smashFactor ? fmt(s.smashFactor, 2) : "—", statKey: "smashFactor" },
  { key: "launchAngle",     label: "Launch°",      render: s => fmt(s.launchAngle),         statKey: "launchAngle" },
  { key: "launchDirection", label: "Launch Dir",   render: s => fmtDir(s.launchDirection),  statKey: "launchDirection" },
  { key: "spinRate",        label: "Spin (rpm)",   render: s => s.spinRate ? fmt(s.spinRate, 0) : "—", statKey: "spinRate" },
  { key: "spinAxis",        label: "Spin Axis",    render: s => fmtDir(s.spinAxis),         statKey: "spinAxis" },
  { key: "backSpin",        label: "Back Spin",    render: s => fmt(s.backSpin, 0),         statKey: "backSpin" },
  { key: "sideSpin",        label: "Side Spin",    render: s => fmtDir(s.sideSpin),         statKey: "sideSpin" },
  { key: "apex",            label: "Apex (yd)",    render: s => fmt(s.apex),                statKey: "apex" },
  { key: "landingAngle",    label: "Land°",        render: s => fmt(s.landingAngle),        statKey: "landingAngle" },
  { key: "clubPath",        label: "Club Path",    render: s => fmtDir(s.clubPath),         statKey: "clubPath" },
  { key: "faceAngle",       label: "Face Angle",   render: s => fmtDir(s.faceAngle),        statKey: "faceAngle" },
  { key: "attackAngle",     label: "Attack°",      render: s => fmt(s.attackAngle),         statKey: "attackAngle" },
  { key: "dynamicLoft",     label: "Dyn Loft",     render: s => fmt(s.dynamicLoft),         statKey: "dynamicLoft" },
  { key: "impactHorizontal",label: "Impact H",     render: s => fmtImpact(s.impactHorizontal), statKey: "impactHorizontal" },
  { key: "impactVertical",  label: "Impact V",     render: s => fmt(s.impactVertical),      statKey: "impactVertical" },
];

const CYCLE: HighlightMode[] = ["off", "positive", "negative", "both"];

export default function ShotsPage() {
  const { analysis, filename, setSelectedShot } = useSession();
  const router = useRouter();

  const [sortKey, setSortKey] = useState<ShotKey>("club");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedClub, setSelectedClub] = useState("All");
  const [hideOutliers, setHideOutliers] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("hideOutliers") === "true"
  );
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(() =>
    (typeof window !== "undefined" ? localStorage.getItem("highlightMode") as HighlightMode : null) ?? "off"
  );
  const [profile] = useState(() => loadProfile());

  function cycleHighlight() {
    const next = CYCLE[(CYCLE.indexOf(highlightMode) + 1) % CYCLE.length];
    setHighlightMode(next);
    localStorage.setItem("highlightMode", next);
  }

  useEffect(() => {
    localStorage.setItem("hideOutliers", String(hideOutliers));
  }, [hideOutliers]);

  const clubs = analysis
    ? ["All", ...new Set(analysis.shots.map(s => s.club))]
    : ["All"];

  const rows = useMemo(() => {
    if (!analysis) return [];
    let shots = hideOutliers
      ? analysis.shots.filter((_, i) => !analysis.outlierIndices.has(i))
      : analysis.shots;
    if (selectedClub !== "All") shots = shots.filter(s => s.club === selectedClub);
    return [...shots].sort((a, b) => {
      const av = a[sortKey];
      const bv = b[sortKey];
      const cmp =
        typeof av === "string"
          ? av.localeCompare(bv as string)
          : (av as number) - (bv as number);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [analysis, sortKey, sortDir, selectedClub, hideOutliers]);

  function handleSort(key: ShotKey) {
    if (key === sortKey) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No session loaded.</p>
          <Link href="/" className="text-sm underline">Load a CSV</Link>
        </div>
      </div>
    );
  }

  const outlierCount = analysis.outlierIndices.size;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="border-b px-6 py-4 flex items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3">
            <Link href="/" className="text-muted-foreground hover:text-foreground text-sm">← Dashboard</Link>
            <h1 className="text-xl font-bold">All Shots</h1>
            <Link href="/profile" className="text-xs text-muted-foreground hover:text-foreground underline">Profile</Link>
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">
            {analysis.meta.date && `${analysis.meta.date}`}
            {analysis.meta.place && ` · ${analysis.meta.place}`}
            {" · "}
            <span className="italic">{filename}</span>
            {" · "}
            {rows.length} shot{rows.length !== 1 ? "s" : ""}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          {clubs.map(club => (
            <Badge
              key={club}
              variant={club === selectedClub ? "default" : "outline"}
              className="cursor-pointer select-none"
              onClick={() => setSelectedClub(club)}
            >
              {club}
            </Badge>
          ))}
          <div className="w-px h-5 bg-border mx-1" />
          <Badge
            variant={hideOutliers ? "default" : "outline"}
            className="cursor-pointer select-none"
            onClick={() => setHideOutliers(v => !v)}
          >
            {hideOutliers ? `Outliers hidden (${outlierCount})` : `Hide outliers (${outlierCount})`}
          </Badge>
          {profile.bag.length > 0 && (
            <>
              <div className="w-px h-5 bg-border mx-1" />
              <span className="text-xs text-muted-foreground">Highlight ideals:</span>
              <button onClick={cycleHighlight} className={[
                "px-3 py-1 rounded border text-xs font-medium",
                highlightMode === "positive" ? "bg-green-500 text-white border-green-500" :
                highlightMode === "negative" ? "bg-red-500 text-white border-red-500" :
                highlightMode === "both"     ? "bg-primary text-primary-foreground border-primary" :
                "text-muted-foreground border-border",
              ].join(" ")}>
                {highlightMode === "off" ? "Off" : highlightMode === "positive" ? "Positive" : highlightMode === "negative" ? "Negative" : "Both"}
              </button>
            </>
          )}
        </div>
      </header>

      <main className="p-6">
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                {COLUMNS.map(col => (
                  <TableHead
                    key={col.key}
                    className="cursor-pointer select-none whitespace-nowrap"
                    onClick={() => handleSort(col.key)}
                  >
                    {col.label}
                    {sortKey === col.key ? (sortDir === "asc" ? " ↑" : " ↓") : ""}
                  </TableHead>
                ))}
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((shot) => {
                const arrayIdx = analysis.shots.indexOf(shot);
                const isOutlier = analysis.outlierIndices.has(arrayIdx);
                const isPoorContact = analysis.poorContactShots.has(shot.index);
                const bagClub = findBagClub(shot.club, profile.bag);
                return (
                  <TableRow
                    key={`${shot.club}-${shot.index}`}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isOutlier ? "opacity-40" : isPoorContact ? "text-muted-foreground" : ""
                    }`}
                    onClick={() => { setSelectedShot(shot); router.push("/shot"); }}
                  >
                    {COLUMNS.map(col => {
                      const status = col.statKey ? profileStatStatus(bagClub, col.statKey, shot[col.key] as number) : undefined;
                      const showGood = status === "good" && (highlightMode === "positive" || highlightMode === "both");
                      const showBad  = status === "bad"  && (highlightMode === "negative" || highlightMode === "both");
                      return (
                        <TableCell
                          key={col.key}
                          className={[
                            "tabular-nums whitespace-nowrap text-sm",
                            showGood ? "bg-green-500/15 text-green-700 dark:text-green-400" : "",
                            showBad  ? "bg-red-500/15 text-red-700 dark:text-red-400"   : "",
                          ].join(" ")}
                        >
                          {col.render(shot)}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      </main>
    </div>
  );
}
