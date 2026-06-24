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
import { useChartTheme } from "@/hooks/useChartTheme";

function smashColor(smash: number): string {
  // 1.20 → red, 1.35 → amber, 1.50 → green
  const t = Math.max(0, Math.min(1, (smash - 1.2) / 0.3));
  const hue = Math.round(t * 120);
  return `hsl(${hue} 75% 50%)`;
}

interface Props {
  shots: Shot[];
}

export function SpinChart({ shots }: Props) {
  const { mutedForeground, border } = useChartTheme();
  const data = shots
    .filter((s) => s.spinRate > 0)
    .map((s) => ({ ...s, x: s.spinRate, y: s.carry }));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Spin Rate vs Carry</CardTitle>
        <p className="text-xs text-muted-foreground">
          Colour by smash factor — <span style={{ color: "hsl(0 75% 50%)" }}>red</span> = poor ·{" "}
          <span style={{ color: "hsl(60 75% 45%)" }}>amber</span> = ok ·{" "}
          <span style={{ color: "hsl(120 75% 40%)" }}>green</span> = solid
        </p>
      </CardHeader>
      <CardContent>
        <div className="relative">
          <div
            className="absolute pointer-events-none border-l border-b border-border"
            style={{ left: 55, right: 16, top: 0, bottom: 38 }}
          />
          <ResponsiveContainer width="100%" height={280}>
            <ScatterChart margin={{ top: 8, right: 16, bottom: 8, left: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke={border} strokeOpacity={0.6} />
              <XAxis
                dataKey="x"
                type="number"
                name="Spin Rate"
                unit=" rpm"
                tick={{ fontSize: 11, fill: mutedForeground }}
                axisLine={{ stroke: border }}
                tickLine={false}
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
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const s = payload[0].payload as Shot;
                  const color = s.smashFactor > 0 ? smashColor(s.smashFactor) : "#888";
                  return (
                    <div className="bg-popover border border-border rounded-lg p-2.5 text-xs shadow-lg">
                      <p className="font-semibold mb-1">
                        {s.club}{" "}
                        <span className="text-muted-foreground font-normal">#{s.index}</span>
                      </p>
                      <p>
                        Spin{" "}
                        <span className="tabular-nums font-medium">
                          {s.spinRate.toFixed(0)} rpm
                        </span>
                      </p>
                      <p>
                        Carry{" "}
                        <span className="tabular-nums font-medium">{s.carry.toFixed(1)} yd</span>
                      </p>
                      {s.smashFactor > 0 && (
                        <p style={{ color }}>
                          Smash{" "}
                          <span className="font-medium tabular-nums">
                            {s.smashFactor.toFixed(2)}
                          </span>
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              <Scatter data={data} isAnimationActive={false}>
                {data.map((entry) => (
                  <Cell
                    key={`${entry.club}-${entry.index}`}
                    fill={entry.smashFactor > 0 ? smashColor(entry.smashFactor) : "#6366f1"}
                    fillOpacity={0.85}
                    r={7}
                    stroke="white"
                    strokeOpacity={0.2}
                    strokeWidth={1}
                  />
                ))}
              </Scatter>
            </ScatterChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
