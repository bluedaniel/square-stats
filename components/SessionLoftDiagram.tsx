"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoftDiagram } from "@/components/LoftDiagram";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  club: string;
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function SessionLoftDiagram({ shots, club }: Props) {
  if (!shots.length) return null;

  const avgLaunchAngle = mean(shots.map((s) => s.launchAngle));
  const avgDynamicLoft = mean(shots.map((s) => s.dynamicLoft));
  const avgAttackAngle = mean(shots.map((s) => s.attackAngle));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Loft &amp; Attack</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average across {shots.length} shot{shots.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <LoftDiagram
          launchAngle={avgLaunchAngle}
          dynamicLoft={avgDynamicLoft}
          attackAngle={avgAttackAngle}
          club={club === "All" ? "driver" : club}
        />
      </CardContent>
    </Card>
  );
}
