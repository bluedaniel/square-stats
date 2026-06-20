"use client";

import {
  ScatterChart,
  Scatter,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
}

export function SpinChart({ shots }: Props) {
  const data = shots
    .filter((s) => s.spinRate > 0)
    .map((s) => ({ ...s, x: s.spinRate, y: s.carry }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Spin Rate vs Carry</CardTitle>
        <p className="text-xs text-muted-foreground">Colour by smash factor — brighter = better contact</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="x" type="number" name="Spin Rate" unit=" rpm" tick={{ fontSize: 11 }} />
            <YAxis dataKey="y" type="number" name="Carry" unit=" yd" width={55} />
            <Tooltip
              content={({ active, payload }) => {
                if (!active || !payload?.length) return null;
                const s = payload[0].payload as Shot;
                return (
                  <div className="bg-card border rounded p-2 text-xs shadow">
                    <p className="font-semibold">{s.club} #{s.index}</p>
                    <p>Spin: {s.spinRate.toFixed(0)} rpm</p>
                    <p>Carry: {s.carry.toFixed(1)} yd</p>
                    {s.smashFactor > 0 && <p>Smash: {s.smashFactor.toFixed(2)}</p>}
                  </div>
                );
              }}
            />
            <Scatter data={data} isAnimationActive={false}>
              {data.map((entry) => {
                const opacity = entry.smashFactor > 0
                  ? 0.3 + Math.min(entry.smashFactor / 1.5, 1) * 0.7
                  : 0.6;
                return (
                  <Cell
                    key={`${entry.club}-${entry.index}`}
                    fill="hsl(var(--primary))"
                    opacity={opacity}
                    r={6}
                  />
                );
              })}
            </Scatter>
          </ScatterChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
