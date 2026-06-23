"use client";

import { useState } from "react";
import { useSession } from "@/contexts/SessionContext";
import { NavBar } from "@/components/NavBar";
import type { SessionAnalysis, ClubStats } from "@/types/shot";
import { FairwayView, CLUB_COLORS } from "@/components/FairwayView";
import { CopyForAIButton } from "@/components/CopyForAIButton";

function gapColor(gap: number) {
  if (gap < 8)  return "text-orange-500";
  if (gap > 20) return "text-amber-500";
  return "text-green-500";
}
function gapLabel(gap: number) {
  if (gap < 8)  return "overlap";
  if (gap > 20) return "big gap";
  return "good";
}

type View = "map" | "table" | "ladder";

function buildAIText(clubs: ClubStats[]): string {
  const header = ["Club", "Shots", "Avg Carry", "±StdDev", "Avg Total", "Ball Speed", "Spin Rate", "Smash"]
    .join("\t");
  const rows = clubs.map((c, i) => {
    const prev = clubs[i - 1];
    const gap  = prev ? ` (gap from ${prev.club}: ${Math.round(prev.avgCarry - c.avgCarry)} yd)` : "";
    return [
      c.club + gap,
      c.count,
      `${Math.round(c.avgCarry)} yd`,
      `±${c.stdDevCarry.toFixed(1)} yd`,
      c.avgTotal > 0 ? `${Math.round(c.avgTotal)} yd` : "—",
      c.avgBallSpeed > 0 ? `${c.avgBallSpeed.toFixed(0)} mph` : "—",
      c.avgSpinRate > 0 ? `${Math.round(c.avgSpinRate)} rpm` : "—",
      c.avgSmash > 0 ? c.avgSmash.toFixed(2) : "—",
    ].join("\t");
  });
  return `Bag Gapping Session\n\n${header}\n${rows.join("\n")}`;
}

export default function BagPage() {
  const { analysis } = useSession();
  const [view, setView] = useState<View>("map");

  const clubs = analysis
    ? [...analysis.clubStats].filter(c => c.avgCarry > 0 && c.count >= 2).sort((a, b) => b.avgCarry - a.avgCarry)
    : [];

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="p-6 space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-lg font-semibold">Bag Gapping</h1>
            <p className="text-xs text-muted-foreground mt-0.5">
              Average carry distances and gaps across your clubs.
            </p>
          </div>
          <div className="flex items-center gap-3">
            {analysis && (
              <CopyForAIButton
                getText={() => buildAIText(clubs)}
                className="text-sm px-3 py-1.5 rounded-lg border border-border text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors"
              />
            )}
            <div className="flex rounded-lg border border-border overflow-hidden text-sm">
              {(["map", "table", "ladder"] as View[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={[
                    "px-4 py-1.5 capitalize transition-colors",
                    view === v
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  {v}
                </button>
              ))}
            </div>
          </div>
        </div>

        {!analysis ? (
          <p className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-lg max-w-lg">
            Load a session from the home screen to see your bag gapping.
          </p>
        ) : (
          <GappingLayout analysis={analysis} view={view} />
        )}
      </main>
    </div>
  );
}

function GappingLayout({ analysis, view }: { analysis: SessionAnalysis; view: View }) {
  const clubs = [...analysis.clubStats]
    .filter(c => c.avgCarry > 0 && c.count >= 2)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  if (!clubs.length) return (
    <p className="text-sm text-muted-foreground text-center py-8">
      Not enough data — need at least 2 shots per club.
    </p>
  );

  if (view === "table") return <TableView clubs={clubs} />;
  if (view === "ladder") return <LadderView clubs={clubs} />;
  return <MapView analysis={analysis} clubs={clubs} />;
}

// ── Map view ──────────────────────────────────────────────────────────────────

function MapView({ analysis, clubs }: { analysis: SessionAnalysis; clubs: ClubStats[] }) {
  const maxCarry = clubs[0].avgCarry;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      <div className="flex-1 min-w-0 w-full space-y-1">
        {clubs.map((club, i) => {
          const prev   = clubs[i - 1];
          const gap    = prev ? Math.round(prev.avgCarry - club.avgCarry) : null;
          const color  = CLUB_COLORS[i % CLUB_COLORS.length];
          const barPct = (club.avgCarry / maxCarry) * 100;

          return (
            <div key={club.club}>
              {gap !== null && (
                <div className={`flex items-center gap-2 text-xs pl-[148px] py-0.5 ${gapColor(gap)}`}>
                  <span className="font-medium">{gap} yd gap</span>
                  <span className="opacity-70">· {gapLabel(gap)}</span>
                </div>
              )}
              <div className="flex items-center gap-3">
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium truncate">{club.club}</span>
                </div>
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div className="h-full rounded-full bg-primary" style={{ width: `${barPct}%` }} />
                  </div>
                  <span className="text-sm tabular-nums font-semibold w-14 shrink-0 text-right">
                    {Math.round(club.avgCarry)} yd
                  </span>
                </div>
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground tabular-nums shrink-0 w-44">
                  <span title="Carry std dev">±{club.stdDevCarry.toFixed(1)} yd</span>
                  <span>{club.avgBallSpeed > 0 ? `${club.avgBallSpeed.toFixed(0)} mph` : "—"}</span>
                  <span>{club.avgSpinRate > 0 ? `${Math.round(club.avgSpinRate)} rpm` : "—"}</span>
                  <span className="text-muted-foreground/50">{club.count} shots</span>
                </div>
              </div>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-muted-foreground border-t border-border">
          <span className="text-green-500">● good gap (8–20 yd)</span>
          <span className="text-amber-500">● big gap (&gt;20 yd)</span>
          <span className="text-orange-500">● overlap (&lt;8 yd)</span>
        </div>
      </div>
      <div className="w-full lg:w-96 lg:shrink-0">
        <FairwayView analysis={analysis} clubs={clubs} />
      </div>
    </div>
  );
}

// ── Table view ────────────────────────────────────────────────────────────────

type SortKey = "club" | "count" | "avgCarry" | "stdDevCarry" | "avgTotal" | "avgBallSpeed" | "avgSpinRate" | "avgSmash";

function TableView({ clubs }: { clubs: ClubStats[] }) {
  const [sortKey, setSortKey] = useState<SortKey>("avgCarry");
  const [sortAsc, setSortAsc] = useState(false);

  function toggle(key: SortKey) {
    if (key === sortKey) setSortAsc(a => !a);
    else { setSortKey(key); setSortAsc(false); }
  }

  const sorted = [...clubs].sort((a, b) => {
    const av = a[sortKey] as number | string;
    const bv = b[sortKey] as number | string;
    const cmp = typeof av === "string" ? av.localeCompare(bv as string) : (av as number) - (bv as number);
    return sortAsc ? cmp : -cmp;
  });

  function Th({ k, label }: { k: SortKey; label: string }) {
    const active = sortKey === k;
    return (
      <th
        className="px-3 py-2 text-left text-xs font-medium text-muted-foreground cursor-pointer select-none hover:text-foreground whitespace-nowrap"
        onClick={() => toggle(k)}
      >
        {label}{active ? (sortAsc ? " ↑" : " ↓") : ""}
      </th>
    );
  }

  return (
    <div className="overflow-x-auto rounded-lg border border-border">
      <table className="w-full text-sm">
        <thead className="border-b border-border bg-muted/40">
          <tr>
            <Th k="club" label="Club" />
            <Th k="count" label="Shots" />
            <Th k="avgCarry" label="Carry" />
            <Th k="stdDevCarry" label="±Carry" />
            <Th k="avgTotal" label="Total" />
            <Th k="avgBallSpeed" label="Ball Speed" />
            <Th k="avgSpinRate" label="Spin" />
            <Th k="avgSmash" label="Smash" />
          </tr>
        </thead>
        <tbody>
          {sorted.map((club, i) => (
            <tr key={club.club} className="border-b border-border/50 last:border-0 hover:bg-muted/30 transition-colors">
              <td className="px-3 py-2 font-medium flex items-center gap-2">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: CLUB_COLORS[clubs.indexOf(club) % CLUB_COLORS.length] }} />
                {club.club}
              </td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{club.count}</td>
              <td className="px-3 py-2 tabular-nums font-semibold">{Math.round(club.avgCarry)} yd</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">±{club.stdDevCarry.toFixed(1)}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{club.avgTotal > 0 ? `${Math.round(club.avgTotal)} yd` : "—"}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{club.avgBallSpeed > 0 ? `${club.avgBallSpeed.toFixed(0)} mph` : "—"}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{club.avgSpinRate > 0 ? `${Math.round(club.avgSpinRate)} rpm` : "—"}</td>
              <td className="px-3 py-2 tabular-nums text-muted-foreground">{club.avgSmash > 0 ? club.avgSmash.toFixed(2) : "—"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

// ── Ladder view ───────────────────────────────────────────────────────────────

function LadderView({ clubs }: { clubs: ClubStats[] }) {
  const ROW_H    = 36;
  const LABEL_W  = 100;
  const PAD_R    = 16;
  const PAD_Y    = 12;
  const svgH     = clubs.length * ROW_H + PAD_Y * 2;

  const minX = Math.max(0, clubs[clubs.length - 1].avgCarry - clubs[clubs.length - 1].stdDevCarry * 2 - 10);
  const maxX = clubs[0].avgCarry + clubs[0].stdDevCarry * 2 + 10;

  function toX(yd: number, chartW: number) {
    return LABEL_W + ((yd - minX) / (maxX - minX)) * chartW;
  }

  // Tick marks every 25 yd
  const ticks: number[] = [];
  const tickStart = Math.ceil(minX / 25) * 25;
  for (let t = tickStart; t <= maxX; t += 25) ticks.push(t);

  return (
    <div className="w-full overflow-x-auto">
      <svg
        viewBox={`0 0 800 ${svgH}`}
        className="w-full"
        style={{ minWidth: 480 }}
      >
        {/* Grid lines + tick labels */}
        {ticks.map(t => {
          const x = toX(t, 800 - LABEL_W - PAD_R);
          return (
            <g key={t}>
              <line x1={x} y1={PAD_Y} x2={x} y2={svgH - PAD_Y}
                stroke="currentColor" strokeOpacity={0.1} strokeWidth={1} />
              <text x={x} y={svgH - 2} fontSize={9} textAnchor="middle"
                fill="currentColor" fillOpacity={0.4} className="tabular-nums">
                {t}
              </text>
            </g>
          );
        })}

        {clubs.map((club, i) => {
          const color   = CLUB_COLORS[i % CLUB_COLORS.length];
          const chartW  = 800 - LABEL_W - PAD_R;
          const cy      = PAD_Y + i * ROW_H + ROW_H / 2;
          const avgX    = toX(club.avgCarry, chartW);
          const loX     = toX(Math.max(minX, club.avgCarry - club.stdDevCarry), chartW);
          const hiX     = toX(Math.min(maxX, club.avgCarry + club.stdDevCarry), chartW);

          const prev = clubs[i - 1];
          const gap  = prev ? Math.round(prev.avgCarry - club.avgCarry) : null;

          return (
            <g key={club.club}>
              {/* Club label */}
              <text x={LABEL_W - 8} y={cy + 1} fontSize={11} textAnchor="end"
                dominantBaseline="middle" fill="currentColor" fontWeight="500">
                {club.club}
              </text>

              {/* Std-dev range capsule */}
              <rect x={loX} y={cy - 6} width={hiX - loX} height={12}
                rx={6} fill={color} fillOpacity={0.25} />

              {/* Avg tick */}
              <line x1={avgX} y1={cy - 9} x2={avgX} y2={cy + 9}
                stroke={color} strokeWidth={2.5} strokeLinecap="round" />

              {/* Avg carry label */}
              <text x={avgX} y={cy - 11} fontSize={9} textAnchor="middle"
                fill={color} fontWeight="700">
                {Math.round(club.avgCarry)}
              </text>

              {/* Gap annotation */}
              {gap !== null && (
                <text
                  x={avgX + 6} y={cy - ROW_H / 2}
                  fontSize={8} fill="currentColor" fillOpacity={0.45}
                  dominantBaseline="middle"
                >
                  {gap} yd
                </text>
              )}
            </g>
          );
        })}

        {/* X axis label */}
        <text x={(800 + LABEL_W) / 2} y={svgH} fontSize={9}
          textAnchor="middle" fill="currentColor" fillOpacity={0.35}>
          carry (yards)
        </text>
      </svg>
    </div>
  );
}
