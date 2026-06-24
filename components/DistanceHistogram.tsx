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
  Cell,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildCarryHistogram } from "@/utils/analyze";
import type { Shot } from "@/types/shot";
import { useChartTheme } from "@/hooks/useChartTheme";

interface Props {
  shots: Shot[];
}

export function DistanceHistogram({ shots }: Props) {
  const { mutedForeground, border } = useChartTheme();
  const bins = buildCarryHistogram(shots);
  const avgCarry = shots.reduce((s, sh) => s + sh.carry, 0) / (shots.length || 1);
  const maxCount = Math.max(...bins.map((b) => b.count), 1);
  const avgBin = bins.find((b) => avgCarry >= b.binStart && avgCarry < b.binStart + 5)?.range;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Carry Distribution</CardTitle>
        <p className="text-xs text-muted-foreground">Avg {avgCarry.toFixed(1)} yd</p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className="absolute pointer-events-none border-l border-b border-border"
            style={{ left: 28, right: 16, top: 0, bottom: 38 }}
          />
          <ResponsiveContainer width="100%" height={280}>
            <BarChart
              data={bins}
              margin={{ top: 8, right: 16, bottom: 8, left: 0 }}
              barCategoryGap="20%"
            >
              <defs>
                <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#0ea5e9" stopOpacity={0.95} />
                  <stop offset="100%" stopColor="#6366f1" stopOpacity={0.7} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={border}
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="range"
                tick={{ fontSize: 10, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
                interval={1}
              />
              <YAxis
                allowDecimals={false}
                width={28}
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
              />
              <Tooltip
                cursor={{ fill: border, opacity: 0.3 }}
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const b = payload[0].payload;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                      <p className="font-medium">{b.range} yd</p>
                      <p className="text-muted-foreground">
                        {b.count} shot{b.count !== 1 ? "s" : ""}
                      </p>
                      <p className="text-muted-foreground">
                        {((b.count / shots.length) * 100).toFixed(0)}%
                      </p>
                    </div>
                  );
                }}
              />
              {avgBin && (
                <ReferenceLine
                  x={avgBin}
                  stroke="#f97316"
                  strokeWidth={2}
                  strokeDasharray="4 4"
                  label={{ value: "avg", position: "top", fontSize: 10, fill: "#f97316" }}
                />
              )}
              <Bar dataKey="count" radius={[4, 4, 0, 0]} isAnimationActive={false}>
                {bins.map((entry, i) => (
                  <Cell
                    key={i}
                    fill="url(#barGradient)"
                    fillOpacity={0.4 + (entry.count / maxCount) * 0.6}
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
