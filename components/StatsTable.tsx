"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { ClubStats } from "@/types/shot";

interface Props {
  clubStats: ClubStats[];
}

type SortKey = keyof ClubStats;

function fmt(n: number, d = 1): string {
  return n === 0 || isNaN(n) ? "—" : n.toFixed(d);
}
function fmtOff(n: number): string {
  if (n === 0 || isNaN(n)) return "0";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}`;
}

const COLUMNS: { key: SortKey; label: string; fmt: (s: ClubStats) => string }[] = [
  { key: "club", label: "Club", fmt: (s) => s.club },
  { key: "count", label: "Shots", fmt: (s) => String(s.count) },
  { key: "avgCarry", label: "Avg Carry", fmt: (s) => `${fmt(s.avgCarry)} yd` },
  { key: "stdDevCarry", label: "Carry ±", fmt: (s) => `${fmt(s.stdDevCarry)} yd` },
  { key: "avgTotal", label: "Avg Total", fmt: (s) => `${fmt(s.avgTotal)} yd` },
  { key: "avgBallSpeed", label: "Ball Speed", fmt: (s) => `${fmt(s.avgBallSpeed)} mph` },
  { key: "avgSmash", label: "Smash", fmt: (s) => fmt(s.avgSmash, 2) },
  { key: "avgSpinRate", label: "Spin Rate", fmt: (s) => `${fmt(s.avgSpinRate, 0)} rpm` },
  { key: "avgOffline", label: "Avg Offline", fmt: (s) => fmtOff(s.avgOffline) },
  { key: "stdDevOffline", label: "Offline ±", fmt: (s) => `${fmt(s.stdDevOffline)} yd` },
];

export function StatsTable({ clubStats }: Props) {
  const [sortKey, setSortKey] = useState<SortKey>("club");
  const [sortAsc, setSortAsc] = useState(true);

  const sorted = [...clubStats].sort((a, b) => {
    const av = a[sortKey];
    const bv = b[sortKey];
    if (typeof av === "string") return sortAsc ? av.localeCompare(bv as string) : (bv as string).localeCompare(av);
    return sortAsc ? (av as number) - (bv as number) : (bv as number) - (av as number);
  });

  function handleSort(key: SortKey) {
    if (key === sortKey) setSortAsc((v) => !v);
    else { setSortKey(key); setSortAsc(true); }
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Club Stats</CardTitle>
        <p className="text-xs text-muted-foreground">Click a column header to sort</p>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              {COLUMNS.map((c) => (
                <TableHead
                  key={c.key}
                  className="cursor-pointer select-none whitespace-nowrap"
                  onClick={() => handleSort(c.key)}
                >
                  {c.label}
                  {sortKey === c.key ? (sortAsc ? " ↑" : " ↓") : ""}
                </TableHead>
              ))}
            </TableRow>
          </TableHeader>
          <TableBody>
            {sorted.map((row) => (
              <TableRow key={row.club}>
                {COLUMNS.map((c) => (
                  <TableCell key={c.key} className="tabular-nums whitespace-nowrap">
                    {c.fmt(row)}
                  </TableCell>
                ))}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
