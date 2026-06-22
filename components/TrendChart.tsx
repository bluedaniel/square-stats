"use client";

import {
  ComposedChart,
  Line,
  Area,
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
import { useChartTheme } from "@/hooks/useChartTheme";

interface Props {
  shots: Shot[];
}

export function TrendChart({ shots }: Props) {
  const { mutedForeground, border } = useChartTheme();
  const data = buildRollingAvg(shots);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Session Trend</CardTitle>
        <p className="text-xs text-muted-foreground">Carry per shot with 5-shot rolling average</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div className="absolute pointer-events-none border-l border-b border-border" style={{ left: 55, right: 16, top: 0, bottom: 56 }} />
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
              <defs>
                <linearGradient id="rollingFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f97316" stopOpacity={0.25} />
                  <stop offset="95%" stopColor="#f97316" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke={border} strokeOpacity={0.6} vertical={false} />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
                label={{ value: "Shot #", position: "insideBottom", offset: -12, fontSize: 10, fill: mutedForeground }}
                height={36}
              />
              <YAxis
                unit=" yd"
                width={55}
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const carry = payload.find(p => p.dataKey === "carry")?.value as number | undefined;
                  const rolling = payload.find(p => p.dataKey === "rolling")?.value as number | undefined;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                      <p className="font-medium mb-1">Shot #{label}</p>
                      {carry != null && <p>Carry <span className="font-medium tabular-nums">{Number(carry).toFixed(1)} yd</span></p>}
                      {rolling != null && <p className="text-[#f97316]">5-shot avg <span className="font-medium tabular-nums">{Number(rolling).toFixed(1)} yd</span></p>}
                    </div>
                  );
                }}
              />
              <Legend
                verticalAlign="top"
                height={28}
                formatter={(value) => <span style={{ fontSize: 11, color: mutedForeground }}>{value}</span>}
              />
              <Line
                type="monotone"
                dataKey="carry"
                name="Carry"
                stroke="#0ea5e9"
                strokeWidth={1.5}
                dot={{ r: 3, fill: "#0ea5e9", strokeWidth: 0, fillOpacity: 0.7 }}
                activeDot={{ r: 5, fill: "#0ea5e9" }}
                strokeOpacity={0.6}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="rolling"
                name="5-shot avg"
                stroke="#f97316"
                strokeWidth={2.5}
                fill="url(#rollingFill)"
                dot={false}
                activeDot={{ r: 5, fill: "#f97316" }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
