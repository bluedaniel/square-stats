"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildRollingAvg } from "@/utils/analyze";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
}

export function TrendChart({ shots }: Props) {
  const data = buildRollingAvg(shots);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Session Trend</CardTitle>
        <p className="text-xs text-muted-foreground">Carry per shot + 5-shot rolling avg</p>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={260}>
          <LineChart data={data} margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
            <XAxis dataKey="index" label={{ value: "Shot #", position: "insideBottom", offset: -4, fontSize: 11 }} height={36} />
            <YAxis unit=" yd" width={55} />
            <Tooltip formatter={(v) => [`${Number(v).toFixed(1)} yd`]} />
            <Legend verticalAlign="top" height={24} />
            <Line
              type="monotone"
              dataKey="carry"
              name="Carry"
              stroke="hsl(var(--primary))"
              dot={{ r: 3 }}
              strokeOpacity={0.5}
              isAnimationActive={false}
            />
            <Line
              type="monotone"
              dataKey="rolling"
              name="5-shot avg"
              stroke="hsl(var(--foreground))"
              dot={false}
              strokeWidth={2}
              isAnimationActive={false}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
}
