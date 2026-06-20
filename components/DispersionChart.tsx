"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  poorContactShots: Set<number>;
}

const CLUB_COLORS: Record<string, string> = {
  "Driver": "#3b82f6",
  "3 Wood": "#8b5cf6",
  "5 Wood": "#a78bfa",
  "3 Iron": "#06b6d4",
  "4 Iron": "#0ea5e9",
  "5 Iron": "#22c55e",
  "6 Iron": "#84cc16",
  "7 Iron": "#eab308",
  "8 Iron": "#f97316",
  "9 Iron": "#ef4444",
  "PW": "#ec4899",
  "GW": "#f43f5e",
  "SW": "#a855f7",
  "LW": "#6366f1",
};

function clubColor(club: string): string {
  return CLUB_COLORS[club] ?? "#94a3b8";
}

interface TooltipProps {
  active?: boolean;
  payload?: { payload: Shot }[];
}

function CustomTooltip({ active, payload }: TooltipProps) {
  if (!active || !payload?.length) return null;
  const s = payload[0].payload;
  const offlineStr = s.offline === 0 ? "0" : `${s.offline > 0 ? "R" : "L"}${Math.abs(s.offline).toFixed(1)}`;
  return (
    <div className="bg-card border rounded p-2 text-xs shadow">
      <p className="font-semibold">{s.club} #{s.index}</p>
      <p>Carry: {s.carry.toFixed(1)} yd</p>
      <p>Offline: {offlineStr} yd</p>
      {s.smashFactor > 0 && <p>Smash: {s.smashFactor.toFixed(2)}</p>}
    </div>
  );
}

export function DispersionChart({ shots, poorContactShots }: Props) {
  const avgCarry =
    shots.reduce((s, sh) => s + sh.carry, 0) / (shots.length || 1);

  const data = shots.map((s) => ({ ...s, x: s.offline, y: s.carry }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shot Dispersion</CardTitle>
        <p className="text-xs text-muted-foreground">Offline (yd) vs Carry — left is negative, right is positive. Dim = poor contact.</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={320}>
          <ScatterChart margin={{ top: 8, right: 24, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              name="Offline"
              tickFormatter={(v) => (v === 0 ? "0" : `${v > 0 ? "R" : "L"}${Math.abs(v)}`)}
              label={{ value: "← Left / Right →", position: "insideBottom", offset: -4, fontSize: 11 }}
              height={40}
            />
            <YAxis dataKey="y" type="number" name="Carry" unit=" yd" width={55} />
            <Tooltip content={<CustomTooltip />} />
            <ReferenceLine x={0} stroke="hsl(var(--foreground))" strokeOpacity={0.3} />
            <ReferenceLine y={avgCarry} stroke="hsl(var(--foreground))" strokeOpacity={0.3} strokeDasharray="4 4" />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell
                  key={`${entry.club}-${entry.index}`}
                  fill={clubColor(entry.club)}
                  opacity={poorContactShots.has(entry.index) ? 0.3 : 0.9}
                  r={6}
                />
              ))}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
