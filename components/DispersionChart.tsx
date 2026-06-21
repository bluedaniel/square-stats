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
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  poorContactShots: Set<number>;
}

export function DispersionChart({ shots, poorContactShots }: Props) {
  const data = shots.map((s) => ({ ...s, x: s.offline, y: s.carry }));
  const avgCarry = shots.reduce((a, b) => a + b.carry, 0) / (shots.length || 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Shot Dispersion</CardTitle>
        <p className="text-xs text-muted-foreground">
          Offline (yd) vs Carry — faded = poor contact
        </p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis
              dataKey="x"
              type="number"
              name="Offline"
              unit=" yd"
              tick={{ fontSize: 11 }}
              label={{
                value: "← L   R →",
                position: "insideBottom",
                offset: -4,
                fontSize: 10,
              }}
            />
            <YAxis
              dataKey="y"
              type="number"
              name="Carry"
              unit=" yd"
              width={55}
            />
            <ReferenceLine
              x={0}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <ReferenceLine
              y={avgCarry}
              stroke="hsl(var(--muted-foreground))"
              strokeDasharray="3 3"
            />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0].payload as Shot;
                return (
                  <div className="bg-card border rounded p-2 text-xs shadow">
                    <p className="font-semibold">
                      {s.club} #{s.index}
                    </p>
                    <p>Carry: {s.carry.toFixed(1)} yd</p>
                    <p>
                      Offline: {s.offline > 0 ? "R" : "L"}
                      {Math.abs(s.offline).toFixed(1)} yd
                    </p>
                  </div>
                );
              }}
            />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((entry) => (
                <Cell
                  key={`${entry.club}-${entry.index}`}
                  fill="hsl(var(--primary))"
                  opacity={poorContactShots.has(entry.index) ? 0.25 : 0.75}
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
