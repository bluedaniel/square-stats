"use client";

import type { SessionAnalysis, ClubStats, Shot } from "@/types/shot";

const CLUB_COLORS = [
  "#22c55e", "#f97316", "#ef4444", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#eab308", "#f43f5e", "#84cc16",
  "#06b6d4", "#a855f7", "#fb923c", "#64748b",
];

export { CLUB_COLORS };

const SVG_W = 360;
const SVG_H = Math.round(360 * (867 / 608)); // match image aspect ratio (608×867)
const FAIRWAY_HALF_PX = 75; // fairway in the photo is ~150px wide

interface Props {
  analysis: SessionAnalysis;
  clubs: ClubStats[];
}

export function FairwayView({ analysis, clubs }: Props) {
  const CARRY_MAX = 350; // full image height = 350 yd

  // Scale offline axis to p95 absolute value so outliers don't compress the band.
  const allOfflines = analysis.shots.map(s => Math.abs(s.offline)).sort((a, b) => a - b);
  const p95idx = Math.floor(allOfflines.length * 0.95);
  const offlineMax = Math.max(allOfflines[p95idx] ?? 0, 10) * 1.15;

  function sx(offline: number) {
    return SVG_W / 2 + (offline / offlineMax) * FAIRWAY_HALF_PX;
  }
  function sy(carry: number) {
    return (1 - carry / CARRY_MAX) * SVG_H;
  }

  const shotsByClub: Record<string, Shot[]> = {};
  for (const s of analysis.shots) {
    (shotsByClub[s.club] ??= []).push(s);
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full rounded-xl overflow-hidden"
    >
      <image
        href="/course/hole_topdown_photo.png"
        x={0} y={0} width={SVG_W} height={SVG_H}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Yardage markers every 50 yd */}
      {[50, 100, 150, 200, 250, 300].map(yd => {
        const y = sy(yd);
        return (
          <g key={yd}>
            <line
              x1={0} y1={y} x2={SVG_W} y2={y}
              stroke="white" strokeWidth={0.75} strokeOpacity={0.3}
              strokeDasharray="4,4"
            />
            <text
              x={6} y={y - 3}
              fontSize={9} fill="white" fillOpacity={0.7} fontWeight="600"
            >
              {yd} yd
            </text>
          </g>
        );
      })}

      {/* Centerline */}
      <line
        x1={SVG_W / 2} y1={0}
        x2={SVG_W / 2} y2={SVG_H}
        stroke="white" strokeWidth={1.5} strokeOpacity={0.35}
        strokeDasharray="6,5"
      />

      {clubs.map((club, ci) => {
        const color = CLUB_COLORS[ci % CLUB_COLORS.length];
        const shots = (shotsByClub[club.club] ?? []).filter(s => s.carry > 0);
        const cx    = sx(club.avgOffline);
        const cy    = sy(club.avgCarry);
        const ry    = Math.max(10, (club.stdDevCarry / CARRY_MAX) * SVG_H * 1.5);
        const rx    = Math.max(8,  (club.stdDevOffline / offlineMax) * FAIRWAY_HALF_PX * 1.5);

        return (
          <g key={club.club}>
            <ellipse
              cx={cx} cy={cy} rx={rx} ry={ry}
              fill="none" stroke={color} strokeWidth={2} strokeOpacity={0.85}
            />
            {shots.map((s, si) => (
              <circle
                key={si}
                cx={sx(s.offline)} cy={sy(s.carry)}
                r={3.5} fill={color} stroke="white" strokeWidth={1} opacity={0.9}
              />
            ))}
            <text
              x={cx + rx + 4} y={cy}
              fontSize={9} fill={color} fontWeight="700" dominantBaseline="middle"
            >
              {club.club}
            </text>
          </g>
        );
      })}
    </svg>
  );
}
