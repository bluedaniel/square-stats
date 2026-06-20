"use client";

import { useState, useMemo } from "react";
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
import type { Shot } from "@/types/shot";

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
}

const COLUMNS: Column[] = [
  { key: "club",           label: "Club",         render: s => s.club },
  { key: "index",          label: "#",            render: s => String(s.index) },
  { key: "carry",          label: "Carry (yd)",   render: s => fmt(s.carry) },
  { key: "total",          label: "Total (yd)",   render: s => fmt(s.total) },
  { key: "offline",        label: "Offline (yd)", render: s => fmtDir(s.offline) },
  { key: "ballSpeed",      label: "Ball Spd",     render: s => fmt(s.ballSpeed) },
  { key: "clubSpeed",      label: "Club Spd",     render: s => s.clubSpeed ? fmt(s.clubSpeed) : "—" },
  { key: "smashFactor",    label: "Smash",        render: s => s.smashFactor ? fmt(s.smashFactor, 2) : "—" },
  { key: "launchAngle",    label: "Launch°",      render: s => fmt(s.launchAngle) },
  { key: "launchDirection",label: "Launch Dir",   render: s => fmtDir(s.launchDirection) },
  { key: "spinRate",       label: "Spin (rpm)",   render: s => s.spinRate ? fmt(s.spinRate, 0) : "—" },
  { key: "spinAxis",       label: "Spin Axis",    render: s => fmtDir(s.spinAxis) },
  { key: "backSpin",       label: "Back Spin",    render: s => fmt(s.backSpin, 0) },
  { key: "sideSpin",       label: "Side Spin",    render: s => fmtDir(s.sideSpin) },
  { key: "apex",           label: "Apex (yd)",    render: s => fmt(s.apex) },
  { key: "landingAngle",   label: "Land°",        render: s => fmt(s.landingAngle) },
  { key: "clubPath",       label: "Club Path",    render: s => fmtDir(s.clubPath) },
  { key: "faceAngle",      label: "Face Angle",   render: s => fmtDir(s.faceAngle) },
  { key: "attackAngle",    label: "Attack°",      render: s => fmt(s.attackAngle) },
  { key: "dynamicLoft",    label: "Dyn Loft",     render: s => fmt(s.dynamicLoft) },
  { key: "impactHorizontal",label: "Impact H",    render: s => fmtImpact(s.impactHorizontal) },
  { key: "impactVertical", label: "Impact V",     render: s => fmt(s.impactVertical) },
];

export default function ShotsPage() {
  const { analysis, filename, setSelectedShot } = useSession();
  const router = useRouter();

  const [sortKey, setSortKey] = useState<ShotKey>("club");
  const [sortDir, setSortDir] = useState<SortDir>("asc");
  const [selectedClub, setSelectedClub] = useState("All");
  const [hideOutliers, setHideOutliers] = useState(false);

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
              {rows.map((shot, i) => {
                const arrayIdx = analysis.shots.indexOf(shot);
                const isOutlier = analysis.outlierIndices.has(arrayIdx);
                const isPoorContact = analysis.poorContactShots.has(shot.index);
                return (
                  <TableRow
                    key={`${shot.club}-${shot.index}`}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isOutlier ? "opacity-40" : isPoorContact ? "text-muted-foreground" : ""
                    }`}
                    onClick={() => { setSelectedShot(shot); router.push("/shot"); }}
                  >
                    {COLUMNS.map(col => (
                      <TableCell key={col.key} className="tabular-nums whitespace-nowrap text-sm">
                        {col.render(shot)}
                      </TableCell>
                    ))}
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
