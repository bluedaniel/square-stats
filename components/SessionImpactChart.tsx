"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  club: string;
}

interface FaceConfig {
  image: string;
  cx: number;
  cy: number;
  scaleX: number;
  scaleY: number;
  sweetSpotV: number;
}

const FACE_CONFIGS: Record<string, FaceConfig> = {
  driver: {
    image: "Driver_Front.png",
    cx: 0.508,
    cy: 0.185,
    scaleX: 0.0075,
    scaleY: 0.0083,
    sweetSpotV: -22,
  },
  "3wood": {
    image: "3Wood_Front.png",
    cx: 0.527,
    cy: 0.298,
    scaleX: 0.0099,
    scaleY: 0.0069,
    sweetSpotV: -18,
  },
  "4iron": {
    image: "4Iron_Front.png",
    cx: 0.459,
    cy: 0.2,
    scaleX: 0.0132,
    scaleY: 0.0165,
    sweetSpotV: -15,
  },
  "7iron": {
    image: "7Iron_Front.png",
    cx: 0.439,
    cy: 0.227,
    scaleX: 0.014,
    scaleY: 0.0161,
    sweetSpotV: -15,
  },
  "9iron": {
    image: "9Iron_Front.png",
    cx: 0.45,
    cy: 0.263,
    scaleX: 0.0145,
    scaleY: 0.0155,
    sweetSpotV: -14,
  },
  pw: {
    image: "PitchingWedge_Front.png",
    cx: 0.422,
    cy: 0.265,
    scaleX: 0.0156,
    scaleY: 0.0158,
    sweetSpotV: -14,
  },
};

function getConfig(club: string): FaceConfig {
  const c = club.toLowerCase().replace(/\s+/g, "");
  if (c.includes("driver")) return FACE_CONFIGS["driver"];
  if (c.includes("3wood") || c === "3w") return FACE_CONFIGS["3wood"];
  if (c.includes("4iron") || c === "4i") return FACE_CONFIGS["4iron"];
  if (c.includes("7iron") || c === "7i") return FACE_CONFIGS["7iron"];
  if (c.includes("9iron") || c === "9i") return FACE_CONFIGS["9iron"];
  if (c.includes("pw") || c.includes("pitching")) return FACE_CONFIGS["pw"];
  if (c.includes("iron") || c.includes("wedge")) return FACE_CONFIGS["7iron"];
  return FACE_CONFIGS["driver"];
}

function impactColor(h: number, v: number, sweetSpotV: number): string {
  const dist = Math.sqrt(h * h + (v - sweetSpotV) ** 2);
  if (dist < 15) return "#22c55e";
  if (dist < 25) return "#eab308";
  return "#ef4444";
}

function mostCommonClub(shots: Shot[]): string {
  const counts: Record<string, number> = {};
  for (const s of shots) counts[s.club] = (counts[s.club] ?? 0) + 1;
  return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? "";
}

const W = 240;
const H = Math.round((W * 449) / 512);

export function SessionImpactChart({ shots, club }: Props) {
  if (!shots.length) return null;

  const effectiveClub = club === "All" ? mostCommonClub(shots) : club;
  const displayShots = club === "All" ? shots.filter((s) => s.club === effectiveClub) : shots;
  const cfg = getConfig(effectiveClub);

  const avgH = displayShots.reduce((a, s) => a + s.impactHorizontal, 0) / displayShots.length;
  const avgV = displayShots.reduce((a, s) => a + s.impactVertical, 0) / displayShots.length;

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">Impact Location</CardTitle>
        <p className="text-xs text-muted-foreground">
          {displayShots.length} shot{displayShots.length !== 1 ? "s" : ""}
          {club === "All" && ` · ${effectiveClub}`}
        </p>
      </CardHeader>
      <CardContent className="pt-0 flex justify-center">
        <div className="relative select-none" style={{ width: W, height: H }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={`/faces/${cfg.image}`}
            alt={`${effectiveClub} face`}
            draggable={false}
            style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
          />

          {/* All shots */}
          {displayShots.map((s, i) => {
            const left = Math.max(
              5,
              Math.min(95, (cfg.cx - s.impactHorizontal * cfg.scaleX) * 100)
            );
            const top = Math.max(5, Math.min(95, (cfg.cy - s.impactVertical * cfg.scaleY) * 100));
            const color = impactColor(s.impactHorizontal, s.impactVertical, cfg.sweetSpotV);
            return (
              <div
                key={i}
                style={{
                  position: "absolute",
                  left: `${left}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                  width: 9,
                  height: 9,
                  borderRadius: "50%",
                  background: color,
                  border: "1.5px solid rgba(255,255,255,0.6)",
                  opacity: 0.85,
                  pointerEvents: "none",
                }}
              />
            );
          })}

          {/* Average position */}
          {(() => {
            const left = Math.max(5, Math.min(95, (cfg.cx - avgH * cfg.scaleX) * 100));
            const top = Math.max(5, Math.min(95, (cfg.cy - avgV * cfg.scaleY) * 100));
            return (
              <>
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: "translate(-50%, -50%)",
                    width: 22,
                    height: 22,
                    borderRadius: "50%",
                    background: "white",
                    opacity: 0.25,
                    pointerEvents: "none",
                  }}
                />
                <div
                  style={{
                    position: "absolute",
                    left: `${left}%`,
                    top: `${top}%`,
                    transform: "translate(-50%, -50%)",
                    width: 10,
                    height: 10,
                    borderRadius: "50%",
                    background: "white",
                    border: "2px solid rgba(0,0,0,0.4)",
                    pointerEvents: "none",
                  }}
                />
              </>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}
