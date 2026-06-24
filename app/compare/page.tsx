"use client";

import { useMemo, useState } from "react";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Legend,
} from "recharts";
import { NavBar } from "@/components/NavBar";
import { ClubSelector } from "@/components/ClubSelector";
import { CopyForAIButton } from "@/components/CopyForAIButton";
import { EmptyState, NoSessionState } from "@/components/EmptyState";
import { GitCompareArrows } from "lucide-react";
import { CLUB_COLORS } from "@/components/FairwayView";
import { useSession } from "@/contexts/SessionContext";
import type { Session } from "@/contexts/SessionContext";

const SESSION_COLORS = [
  "#3b82f6", "#22c55e", "#f97316", "#ef4444",
  "#8b5cf6", "#ec4899", "#14b8a6", "#eab308",
];

function shortName(s: Session) {
  return s.filename.replace(/\.csv$/i, "");
}

function mean(nums: number[]) {
  const valid = nums.filter(n => n > 0);
  return valid.length ? valid.reduce((a, b) => a + b, 0) / valid.length : 0;
}

const OVERVIEW_METRICS = [
  { key: "shots",    label: "Shots",      fmt: (n: number) => String(Math.round(n)) },
  { key: "carry",    label: "Avg Carry",  fmt: (n: number) => `${Math.round(n)} yd` },
  { key: "speed",    label: "Ball Speed", fmt: (n: number) => n > 0 ? `${n.toFixed(0)} mph` : "—" },
  { key: "spin",     label: "Spin Rate",  fmt: (n: number) => n > 0 ? `${Math.round(n)} rpm` : "—" },
  { key: "smash",    label: "Smash",      fmt: (n: number) => n > 0 ? n.toFixed(2) : "—" },
  { key: "offline",  label: "Avg Offline",fmt: (n: number) => {
    if (n === 0) return "0.0 yd";
    return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)} yd`;
  }},
] as const;

type MetricKey = typeof OVERVIEW_METRICS[number]["key"];

export default function ComparePage() {
  const { sessions } = useSession();

  if (sessions.length === 0) {
    return (
      <div className="min-h-screen bg-background text-foreground">
        <NavBar />
        <div className="flex-1 overflow-hidden"><NoSessionState page="compare" /></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="p-6 space-y-8">
        <div>
          <h1 className="text-lg font-semibold">Compare Sessions</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Side-by-side comparison across loaded sessions.
          </p>
        </div>

        {sessions.length < 2 ? (
          <EmptyState
            icon={GitCompareArrows}
            title="Not enough sessions"
            description="Load at least 2 CSV sessions to compare them side by side."
          />
        ) : (
          <CompareContent sessions={sessions} />
        )}

      </main>
    </div>
  );
}

const CHART_METRICS = [
  { key: "avgCarry",     label: "Carry",      unit: " yd",  fmt: (n: number) => `${Math.round(n)} yd` },
  { key: "avgBallSpeed", label: "Ball Speed", unit: " mph", fmt: (n: number) => `${n.toFixed(0)} mph` },
  { key: "avgSpinRate",  label: "Spin Rate",  unit: " rpm", fmt: (n: number) => `${Math.round(n)} rpm` },
  { key: "avgSmash",     label: "Smash",      unit: "",     fmt: (n: number) => n.toFixed(2) },
  { key: "avgOffline",   label: "Offline",    unit: " yd",  fmt: (n: number) => `${n > 0 ? "R" : n < 0 ? "L" : ""}${Math.abs(n).toFixed(1)} yd` },
] as const;

type ChartMetricKey = typeof CHART_METRICS[number]["key"];

function buildCompareAIText(sessions: Session[], commonClubs: string[]): string {
  const lines: string[] = ["Session comparison", ""];
  for (const s of sessions) {
    lines.push(`Session: ${s.filename} (${s.analysis.meta.date}${s.analysis.meta.place ? ` · ${s.analysis.meta.place}` : ""})`);
  }
  lines.push("", "Per-club averages (carry yd / ball speed mph / spin rpm / smash / offline yd)");
  const header = ["Club", ...sessions.map(s => s.filename.replace(/\.csv$/i, ""))].join("\t");
  lines.push(header);
  for (const club of commonClubs) {
    const cols = sessions.map(s => {
      const st = s.analysis.clubStats.find(c => c.club === club);
      if (!st) return "—";
      const off = st.avgOffline === 0 ? "0.0" : `${st.avgOffline > 0 ? "R" : "L"}${Math.abs(st.avgOffline).toFixed(1)}`;
      return `${Math.round(st.avgCarry)} / ${st.avgBallSpeed > 0 ? st.avgBallSpeed.toFixed(0) : "—"} / ${st.avgSpinRate > 0 ? Math.round(st.avgSpinRate) : "—"} / ${st.avgSmash > 0 ? st.avgSmash.toFixed(2) : "—"} / ${off}`;
    });
    lines.push([club, ...cols].join("\t"));
  }
  return lines.join("\n");
}

function CompareContent({ sessions }: { sessions: Session[] }) {
  const [selectedClub, setSelectedClub] = useState("All");
  const [chartMetric, setChartMetric] = useState<ChartMetricKey>("avgCarry");

  // Clubs that appear in at least 2 sessions (with ≥2 shots each)
  const commonClubs = useMemo(() => {
    const counts = new Map<string, number>();
    for (const s of sessions) {
      for (const c of s.analysis.clubStats) {
        if (c.count >= 2 && c.avgCarry > 0) {
          counts.set(c.club, (counts.get(c.club) ?? 0) + 1);
        }
      }
    }
    return [...counts.entries()]
      .filter(([, n]) => n >= 2)
      .map(([club]) => club)
      .sort((a, b) => {
        const maxA = Math.max(...sessions.map(s => s.analysis.clubStats.find(c => c.club === a)?.avgCarry ?? 0));
        const maxB = Math.max(...sessions.map(s => s.analysis.clubStats.find(c => c.club === b)?.avgCarry ?? 0));
        return maxB - maxA;
      });
  }, [sessions]);

  // Overview stats — per-club when filtered, all shots when "All"
  const overviewRows = useMemo(() =>
    sessions.map(s => {
      if (selectedClub !== "All") {
        const stat = s.analysis.clubStats.find(c => c.club === selectedClub);
        return {
          session: s,
          shots:   stat?.count ?? 0,
          carry:   stat?.avgCarry ?? 0,
          speed:   stat?.avgBallSpeed ?? 0,
          spin:    stat?.avgSpinRate ?? 0,
          smash:   stat?.avgSmash ?? 0,
          offline: stat?.avgOffline ?? 0,
        };
      }
      const shots = s.analysis.shots;
      return {
        session: s,
        shots:   shots.length,
        carry:   mean(shots.map(sh => sh.carry)),
        speed:   mean(shots.map(sh => sh.ballSpeed)),
        spin:    mean(shots.map(sh => sh.spinRate)),
        smash:   mean(shots.map(sh => sh.smashFactor)),
        offline: shots.reduce((a, sh) => a + sh.offline, 0) / (shots.length || 1),
      };
    }),
  [sessions, selectedClub]);

  // Sort sessions by date ascending for the X axis
  const sortedSessions = useMemo(() =>
    [...sessions].sort((a, b) => a.analysis.meta.date.localeCompare(b.analysis.meta.date)),
  [sessions]);

  // One entry per session (date), one key per club
  const lineChartData = useMemo(() =>
    sortedSessions.map(s => {
      const entry: Record<string, string | number> = { date: s.analysis.meta.date };
      for (const club of commonClubs) {
        const stat = s.analysis.clubStats.find(c => c.club === club);
        if (stat && stat.count >= 2) entry[club] = Number(stat[chartMetric].toFixed(2));
      }
      return entry;
    }),
  [sortedSessions, commonClubs, chartMetric]);

  const selectorClubs = ["All", ...commonClubs];

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between gap-4">
        <ClubSelector clubs={selectorClubs} selected={selectedClub} onChange={setSelectedClub} />
        <CopyForAIButton
          getText={() => buildCompareAIText(sessions, commonClubs)}
          className="shrink-0 text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"
        />
      </div>

      {/* Overview */}
      <section>
        <h2 className="text-sm font-semibold mb-3 text-muted-foreground uppercase tracking-wide">Overview</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground w-32">Metric</th>
                {sessions.map((s, i) => (
                  <th key={s.id} className="text-left px-3 py-2" style={{ color: SESSION_COLORS[i % SESSION_COLORS.length] }}>
                    <div className="text-xs font-semibold">{shortName(s)}</div>
                    <div className="text-xs font-normal opacity-60">{s.analysis.meta.date}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {OVERVIEW_METRICS.map(({ key, label, fmt }) => (
                <tr key={key} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 text-xs text-muted-foreground font-medium">{label}</td>
                  {overviewRows.map(row => (
                    <td key={row.session.id} className="px-3 py-2 tabular-nums font-medium">
                      {fmt(row[key as MetricKey] as number)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Per-club line chart */}
      {commonClubs.length > 0 && (
        <section className="space-y-3">
          <div className="flex items-center gap-3 flex-wrap">
            <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">By Club</h2>
            <div className="flex rounded-lg border border-border overflow-hidden text-xs">
              {CHART_METRICS.map(m => (
                <button
                  key={m.key}
                  onClick={() => setChartMetric(m.key)}
                  className={[
                    "px-3 py-1.5 transition-colors",
                    chartMetric === m.key
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover:text-foreground hover:bg-muted/50",
                  ].join(" ")}
                >
                  {m.label}
                </button>
              ))}
            </div>
          </div>

          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={lineChartData} margin={{ left: 8, right: 24, top: 8, bottom: 8 }}>
              <CartesianGrid stroke="currentColor" strokeOpacity={0.07} />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                tickFormatter={v => `${v}${CHART_METRICS.find(m => m.key === chartMetric)?.unit ?? ""}`}
                width={56}
              />
              <Tooltip
                formatter={(value: unknown, name: unknown) => {
                  const metric = CHART_METRICS.find(m => m.key === chartMetric);
                  return [metric ? metric.fmt(value as number) : String(value), name as string];
                }}
                contentStyle={{ fontSize: 12 }}
              />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 8 }} />
              {(selectedClub === "All" ? commonClubs : [selectedClub]).map((club, i) => (
                <Line
                  key={club}
                  dataKey={club}
                  stroke={CLUB_COLORS[commonClubs.indexOf(club) % CLUB_COLORS.length]}
                  strokeWidth={2}
                  dot={{ r: 4 }}
                  activeDot={{ r: 6 }}
                  connectNulls
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </section>
      )}

      {/* Per-club stats delta table */}
      {sessions.length === 2 && commonClubs.length > 0 && (
        <DeltaTable sessions={sessions} clubs={commonClubs} />
      )}
    </div>
  );
}

function DeltaTable({ sessions, clubs }: { sessions: Session[]; clubs: string[] }) {
  const [s1, s2] = sessions;

  function stat(session: Session, club: string) {
    return session.analysis.clubStats.find(c => c.club === club);
  }

  function delta(a: number, b: number) {
    const d = b - a;
    if (Math.abs(d) < 0.5) return <span className="text-muted-foreground">—</span>;
    return (
      <span className={d > 0 ? "text-green-500" : "text-red-500"}>
        {d > 0 ? "+" : ""}{Math.round(d)}
      </span>
    );
  }

  return (
    <section>
      <h2 className="text-sm font-semibold mb-1 text-muted-foreground uppercase tracking-wide">Delta</h2>
      <p className="text-xs text-muted-foreground mb-3">
        <span style={{ color: SESSION_COLORS[0] }}>{shortName(s1)}</span>
        {" → "}
        <span style={{ color: SESSION_COLORS[1] }}>{shortName(s2)}</span>
      </p>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-border">
              {["Club", "Carry", "±Carry", "Ball Speed", "Spin", "Smash"].map(h => (
                <th key={h} className="text-left px-3 py-2 text-xs font-medium text-muted-foreground whitespace-nowrap">{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {clubs.map(club => {
              const a = stat(s1, club);
              const b = stat(s2, club);
              if (!a || !b) return null;
              return (
                <tr key={club} className="border-b border-border/50 last:border-0 hover:bg-muted/20 transition-colors">
                  <td className="px-3 py-2 font-medium">{club}</td>
                  <td className="px-3 py-2 tabular-nums">{delta(a.avgCarry, b.avgCarry)}</td>
                  <td className="px-3 py-2 tabular-nums">{delta(a.stdDevCarry, b.stdDevCarry)}</td>
                  <td className="px-3 py-2 tabular-nums">{delta(a.avgBallSpeed, b.avgBallSpeed)}</td>
                  <td className="px-3 py-2 tabular-nums">{delta(a.avgSpinRate, b.avgSpinRate)}</td>
                  <td className="px-3 py-2 tabular-nums">{b.avgSmash > 0 && a.avgSmash > 0 ? delta(a.avgSmash * 100, b.avgSmash * 100) : "—"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
