"use client";

import { Card, CardContent } from "@/components/ui/card";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return Math.sqrt(vals.reduce((s, v) => s + (v - m) ** 2, 0) / vals.length);
}

function fmt(n: number, decimals = 1): string {
  return isNaN(n) || n === 0 ? "—" : n.toFixed(decimals);
}

function fmtOffline(n: number): string {
  if (isNaN(n) || n === 0) return "0";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}`;
}

export function StatsCards({ shots }: Props) {
  const smashes = shots.map((s) => s.smashFactor).filter((s) => s > 0);
  const ballSpeeds = shots.map((s) => s.ballSpeed).filter((s) => s > 0);
  const spinRates = shots.map((s) => s.spinRate).filter((s) => s > 0);

  const cards = [
    { label: "Shots", value: shots.length.toString() },
    { label: "Avg Carry", value: `${fmt(mean(shots.map((s) => s.carry)))} yd` },
    { label: "Carry ±", value: `${fmt(stdDev(shots.map((s) => s.carry)))} yd` },
    { label: "Avg Ball Speed", value: `${fmt(mean(ballSpeeds))} mph` },
    { label: "Smash Factor", value: fmt(mean(smashes), 2) },
    { label: "Avg Spin", value: `${fmt(mean(spinRates), 0)} rpm` },
    { label: "Avg Offline", value: fmtOffline(mean(shots.map((s) => s.offline))) },
  ];

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
      {cards.map((c) => (
        <Card key={c.label}>
          <CardContent className="p-4">
            <p className="text-xs text-muted-foreground uppercase tracking-wide">{c.label}</p>
            <p className="text-2xl font-bold mt-1 tabular-nums">{c.value}</p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
