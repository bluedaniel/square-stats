"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { FaceToPath } from "@/components/FaceToPath";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  club: string;
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

export function SessionFaceToPath({ shots, club }: Props) {
  if (!shots.length) return null;

  const avgLaunchDirection = mean(shots.map(s => s.launchDirection));
  const avgFaceAngle       = mean(shots.map(s => s.faceAngle));
  const avgClubPath        = mean(shots.map(s => s.clubPath));

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Face &amp; Path</CardTitle>
        <p className="text-xs text-muted-foreground">
          Average across {shots.length} shot{shots.length !== 1 ? "s" : ""}
        </p>
      </CardHeader>
      <CardContent className="pt-0">
        <FaceToPath
          launchDirection={avgLaunchDirection}
          faceAngle={avgFaceAngle}
          clubPath={avgClubPath}
          club={club === "All" ? "driver" : club}
        />
      </CardContent>
    </Card>
  );
}
