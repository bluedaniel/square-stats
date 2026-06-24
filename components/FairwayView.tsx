"use client";

import type { ClubStats, Shot } from "@/types/shot";

const CLUB_COLORS = [
  "#22c55e", "#f97316", "#ef4444", "#3b82f6", "#8b5cf6",
  "#ec4899", "#14b8a6", "#eab308", "#f43f5e", "#84cc16",
  "#06b6d4", "#a855f7", "#fb923c", "#64748b",
];

export { CLUB_COLORS };

const SVG_W = 360;
const FULL_SVG_H = Math.round(SVG_W * (867 / 608)); // image aspect ratio (608×867), represents 350 yd
const PX_PER_YD = FULL_SVG_H / 350;
const FAIRWAY_HALF_PX = 75; // fairway in the photo is ~150px wide

interface Props {
  shots: Shot[];
  clubs: ClubStats[];
  highlightShot?: Shot;
}

export function FairwayView({ shots, clubs, highlightShot }: Props) {
  // Derive max carry from the clubs being displayed, rounded up to next 50yd + 10% buffer
  const allCarries = clubs.flatMap(c =>
    shots.filter(s => s.club === c.club && s.carry > 0).map(s => s.carry)
  );
  const rawMax = allCarries.length ? Math.max(...allCarries) : 350;
  const CARRY_MAX = Math.ceil((rawMax * 1.1) / 50) * 50;
  const SVG_H = Math.round(CARRY_MAX * PX_PER_YD);

  // Scale offline axis to p95 absolute value so outliers don't compress the band.
  const allOfflines = shots.map(s => Math.abs(s.offline)).sort((a, b) => a - b);
  const p95idx = Math.floor(allOfflines.length * 0.95);
  const offlineMax = Math.max(allOfflines[p95idx] ?? 0, 10) * 1.15;

  function sx(offline: number) {
    return SVG_W / 2 + (offline / offlineMax) * FAIRWAY_HALF_PX;
  }
  function sy(carry: number) {
    return (1 - carry / CARRY_MAX) * SVG_H;
  }

  const shotsByClub: Record<string, Shot[]> = {};
  for (const s of shots) {
    (shotsByClub[s.club] ??= []).push(s);
  }

  return (
    <svg
      viewBox={`0 0 ${SVG_W} ${SVG_H}`}
      className="w-full rounded-xl overflow-hidden"
    >
      {/* Image anchored at bottom so shorter views crop from the top */}
      <image
        href="/course/hole_topdown_photo.png"
        x={0} y={SVG_H - FULL_SVG_H} width={SVG_W} height={FULL_SVG_H}
        preserveAspectRatio="xMidYMid meet"
      />

      {/* Yardage markers every 50 yd, only up to CARRY_MAX */}
      {[50, 100, 150, 200, 250, 300].filter(yd => yd < CARRY_MAX).map(yd => {
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
            {shots.map((s, si) => {
              const isHighlight = highlightShot && s === highlightShot;
              return (
                <g key={si}>
                  <circle
                    cx={sx(s.offline)} cy={sy(s.carry)}
                    r={isHighlight ? 5.5 : 3.5}
                    fill={isHighlight ? "#facc15" : color}
                    stroke="white" strokeWidth={isHighlight ? 1.5 : 1}
                    opacity={isHighlight ? 1 : 0.9}
                  />
                  {isHighlight && (
                    <text
                      x={sx(s.offline)} y={sy(s.carry) - 9}
                      textAnchor="middle" fontSize={8} fontWeight="700" fill="#facc15"
                    >
                      #{s.index}
                    </text>
                  )}
                </g>
              );
            })}
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
