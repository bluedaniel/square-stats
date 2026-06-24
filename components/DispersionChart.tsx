"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  ReferenceLine,
  Tooltip,
  ResponsiveContainer,
  Cell,
  Legend,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shot } from "@/types/shot";
import { useChartTheme } from "@/hooks/useChartTheme";

const PALETTE = [
  "#6366f1",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#f43f5e",
  "#8b5cf6",
  "#f97316",
  "#14b8a6",
];

interface Props {
  shots: Shot[];
  poorContactShots: Set<number>;
}

export function DispersionChart({ shots, poorContactShots }: Props) {
  const { mutedForeground, border } = useChartTheme();
  const data = shots.map((s) => ({ ...s, x: s.offline, y: s.carry }));
  const avgCarry = shots.reduce((a, b) => a + b.carry, 0) / (shots.length || 1);
  const clubs = [...new Set(shots.map((s) => s.club))];
  const multiClub = clubs.length > 1;

  function dotColor(club: string) {
    if (!multiClub) return PALETTE[0];
    return PALETTE[clubs.indexOf(club) % PALETTE.length];
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shot Dispersion</CardTitle>
        <p className="text-xs text-muted-foreground">Offline vs Carry · faded = poor contact</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className="absolute pointer-events-none border-l border-b border-border"
            style={{ left: 55, right: 16, top: 0, bottom: 50 }}
          />
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
              <defs>
                <radialGradient id="dotGlow" cx="50%" cy="50%" r="50%">
                  <stop offset="0%" stopOpacity={1} />
                  <stop offset="100%" stopOpacity={0.4} />
                </radialGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={border} strokeOpacity={0.6} />
              <XAxis
                dataKey="x"
                type="number"
                name="Offline"
                unit=" yd"
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
                label={{
                  value: "← Left   Right →",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 10,
                  fill: mutedForeground,
                }}
              />
              <YAxis
                dataKey="y"
                type="number"
                name="Carry"
                unit=" yd"
                width={55}
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
              />
              <ReferenceLine x={0} stroke={mutedForeground} strokeOpacity={0.4} />
              <ReferenceLine
                y={avgCarry}
                stroke={mutedForeground}
                strokeDasharray="4 4"
                strokeOpacity={0.5}
                label={{
                  value: `avg ${avgCarry.toFixed(0)}`,
                  position: "insideTopRight",
                  fontSize: 10,
                  fill: mutedForeground,
                }}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const s = payload[0].payload as Shot;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                      <p className="font-semibold mb-1">
                        {s.club}{" "}
                        <span className="text-muted-foreground font-normal">#{s.index}</span>
                      </p>
                      <p>
                        Carry{" "}
                        <span className="tabular-nums font-medium">{s.carry.toFixed(1)} yd</span>
                      </p>
                      <p>
                        Offline{" "}
                        <span className="tabular-nums font-medium">
                          {s.offline > 0 ? "R" : s.offline < 0 ? "L" : ""}
                          {Math.abs(s.offline).toFixed(1)} yd
                        </span>
                      </p>
                      {s.smashFactor > 0 && (
                        <p className="text-muted-foreground">Smash {s.smashFactor.toFixed(2)}</p>
                      )}
                    </div>
                  );
                }}
              />
              {multiClub && (
                <Legend
                  verticalAlign="top"
                  height={28}
                  formatter={(value) => (
                    <span style={{ fontSize: 11, color: mutedForeground }}>{value}</span>
                  )}
                />
              )}
              {multiClub ? (
                clubs.map((club, ci) => (
                  <Scatter
                    key={club}
                    name={club}
                    data={data.filter((d) => d.club === club)}
                    isAnimationActive={false}
                    fill={PALETTE[ci % PALETTE.length]}
                  >
                    {data
                      .filter((d) => d.club === club)
                      .map((entry) => (
                        <Cell
                          key={`${entry.club}-${entry.index}`}
                          fill={dotColor(entry.club)}
                          fillOpacity={poorContactShots.has(entry.index) ? 0.2 : 0.85}
                          r={poorContactShots.has(entry.index) ? 4 : 6}
                        />
                      ))}
                  </Scatter>
                ))
              ) : (
                <Scatter data={data} isAnimationActive={false}>
                  {data.map((entry) => (
                    <Cell
                      key={`${entry.club}-${entry.index}`}
                      fill={PALETTE[0]}
                      fillOpacity={poorContactShots.has(entry.index) ? 0.2 : 0.85}
                      r={poorContactShots.has(entry.index) ? 4 : 6}
                    />
                  ))}
                </Scatter>
              )}
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
