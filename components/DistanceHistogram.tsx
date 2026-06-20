"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCarryHistogram } from "@/utils/analyze";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
}

export function DistanceHistogram({ shots }: Props) {
  const bins = buildCarryHistogram(shots);
  const avgCarry = shots.reduce((s, sh) => s + sh.carry, 0) / (shots.length || 1);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Carry Distance Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">Dashed line = avg carry ({avgCarry.toFixed(1)} yd)</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <BarChart data={bins} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="range" tick={{ fontSize: 11 }} />
            <YAxis allowDecimals={false} width={30} />
            <Tooltip formatter={(v) => [v, "Shots"]} />
            <ReferenceLine
              x={bins.find((b) => avgCarry >= b.binStart && avgCarry < b.binStart + 5)?.range}
              stroke="hsl(var(--foreground))"
              strokeDasharray="4 4"
              strokeOpacity={0.6}
            />
            <Bar dataKey="count" fill="hsl(var(--primary))" radius={[3, 3, 0, 0]} isAnimationActive={false} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
