"use client";

import { useState } from "react";
import {
  ComposedChart,
  Line,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { buildRollingAvg } from "@/utils/analyze";
import type { Shot } from "@/types/shot";
import { useChartTheme } from "@/hooks/useChartTheme";

interface Metric {
  key: string;
  label: string;
  unit: string;
  decimals: number;
  color: string;
  getValue: (s: Shot) => number;
  filter?: (s: Shot) => boolean;
}

const METRICS: Metric[] = [
  {
    key: "carry",
    label: "Carry",
    unit: " yd",
    decimals: 1,
    color: "#0ea5e9",
    getValue: (s) => s.carry,
  },
  {
    key: "ballSpeed",
    label: "Ball Speed",
    unit: " mph",
    decimals: 1,
    color: "#8b5cf6",
    getValue: (s) => s.ballSpeed,
    filter: (s) => s.ballSpeed > 0,
  },
  {
    key: "smash",
    label: "Smash",
    unit: "",
    decimals: 2,
    color: "#10b981",
    getValue: (s) => s.smashFactor,
    filter: (s) => s.smashFactor > 0,
  },
  {
    key: "spinRate",
    label: "Spin",
    unit: " rpm",
    decimals: 0,
    color: "#f59e0b",
    getValue: (s) => s.spinRate,
    filter: (s) => s.spinRate > 0,
  },
  {
    key: "offline",
    label: "Offline",
    unit: " yd",
    decimals: 1,
    color: "#ef4444",
    getValue: (s) => s.offline,
  },
];

interface Props {
  shots: Shot[];
}

export function TrendChart({ shots }: Props) {
  const { mutedForeground, border } = useChartTheme();
  const [metricKey, setMetricKey] = useState("carry");
  const metric = METRICS.find((m) => m.key === metricKey) ?? METRICS[0];

  const filteredShots = metric.filter ? shots.filter(metric.filter) : shots;
  const data = buildRollingAvg(filteredShots, metric.getValue);

  const gradientId = `trendFill-${metric.key}`;

  function fmt(v: number) {
    return v.toFixed(metric.decimals) + metric.unit;
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between gap-2 flex-wrap">
          <CardTitle className="text-base">Session Trend</CardTitle>
          <div className="flex items-center gap-0.5 bg-muted rounded-md p-0.5">
            {METRICS.map((m) => (
              <button
                key={m.key}
                onClick={() => setMetricKey(m.key)}
                className={[
                  "px-2 py-0.5 text-xs rounded transition-colors select-none",
                  m.key === metricKey
                    ? "bg-background shadow-sm font-medium text-foreground"
                    : "text-muted-foreground hover:text-foreground",
                ].join(" ")}
              >
                {m.label}
              </button>
            ))}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">
          {metric.label} per shot with 5-shot rolling average
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className="absolute pointer-events-none border-l border-b border-border"
            style={{ left: 55, right: 16, top: 0, bottom: 56 }}
          />
          <ResponsiveContainer width="100%" height={280}>
            <ComposedChart data={data} margin={{ top: 8, right: 16, bottom: 20, left: 0 }}>
              <defs>
                <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor={metric.color} stopOpacity={0.25} />
                  <stop offset="95%" stopColor={metric.color} stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke={border}
                strokeOpacity={0.6}
                vertical={false}
              />
              <XAxis
                dataKey="index"
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
                label={{
                  value: "Shot #",
                  position: "insideBottom",
                  offset: -12,
                  fontSize: 10,
                  fill: mutedForeground,
                }}
                height={36}
              />
              <YAxis
                unit={metric.unit}
                width={55}
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
                tickFormatter={(v) => v.toFixed(metric.decimals)}
              />
              <Tooltip
                content={({ active, payload, label }) => {
                  if (!active || !payload?.length) return null;
                  const value = payload.find((p) => p.dataKey === "value")?.value as
                    | number
                    | undefined;
                  const rolling = payload.find((p) => p.dataKey === "rolling")?.value as
                    | number
                    | undefined;
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                      <p className="font-medium mb-1">Shot #{label}</p>
                      {value != null && (
                        <p>
                          {metric.label}{" "}
                          <span className="font-medium tabular-nums">{fmt(Number(value))}</span>
                        </p>
                      )}
                      {rolling != null && (
                        <p style={{ color: metric.color }}>
                          5-shot avg{" "}
                          <span className="font-medium tabular-nums">{fmt(Number(rolling))}</span>
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Line
                type="monotone"
                dataKey="value"
                name={metric.label}
                stroke={metric.color}
                strokeWidth={1.5}
                dot={{ r: 3, fill: metric.color, strokeWidth: 0, fillOpacity: 0.7 }}
                activeDot={{ r: 5, fill: metric.color }}
                strokeOpacity={0.6}
                isAnimationActive={false}
              />
              <Area
                type="monotone"
                dataKey="rolling"
                name="5-shot avg"
                stroke={metric.color}
                strokeWidth={2.5}
                fill={`url(#${gradientId})`}
                dot={false}
                activeDot={{ r: 5, fill: metric.color }}
                isAnimationActive={false}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
