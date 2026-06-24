"use client";

import type { Shot } from "@/types/shot";

interface Props {
  shots: Shot[];
  currentShot: Shot;
}

export function LandingChart({ shots, currentShot }: Props) {
  if (!shots.length) return null;

  const carries = shots.map((s) => s.carry);
  const offlines = shots.map((s) => s.offline);

  const maxCarry = Math.max(...carries);
  const maxAbsOffline = Math.max(...offlines.map(Math.abs), 20);

  const displayMaxCarry = Math.ceil((maxCarry + 15) / 50) * 50;
  const displayMaxOffline = Math.ceil((maxAbsOffline + 8) / 25) * 25;

  const SVG_W = 160;
  const SVG_H = 385; // fixed aspect (160:385 ≈ 208px:500px at w-52)
  const PAD_TOP = 18;
  const PAD_BOT = 18;
  const PAD_SIDE = 22;

  const innerH = SVG_H - PAD_TOP - PAD_BOT; // 349

  // Scale driven by carry (y-axis fills height); arcs stay circular
  const scale = innerH / displayMaxCarry;

  const cx = SVG_W / 2;
  const golferY = SVG_H - PAD_BOT;

  const toX = (offline: number) => cx + offline * scale;
  const toY = (carry: number) => golferY - carry * scale;

  const arcYards: number[] = [];
  for (let d = 50; d <= displayMaxCarry; d += 50) arcYards.push(d);

  const n = carries.length;
  const meanCarry = carries.reduce((a, b) => a + b, 0) / n;
  const meanOff = offlines.reduce((a, b) => a + b, 0) / n;
  const stdCarry =
    n > 1 ? Math.sqrt(carries.reduce((a, b) => a + (b - meanCarry) ** 2, 0) / n) : 10;
  const stdOff = n > 1 ? Math.sqrt(offlines.reduce((a, b) => a + (b - meanOff) ** 2, 0) / n) : 5;

  const ellipseRx = Math.max(stdOff * 1.5, 4) * scale;
  const ellipseRy = Math.max(stdCarry * 1.5, 8) * scale;

  return (
    <svg viewBox={`0 0 ${SVG_W} ${SVG_H}`} className="w-full rounded">
      {/* Background */}
      <rect width={SVG_W} height={SVG_H} fill="#4a7c34" />

      {/* Vertical offline grid */}
      {([-2, -1, 1, 2] as const)
        .map((n) => (n * displayMaxOffline) / 2)
        .map((off) => (
          <line
            key={off}
            x1={toX(off)}
            y1={PAD_TOP}
            x2={toX(off)}
            y2={golferY}
            stroke="#3b6929"
            strokeWidth={0.5}
          />
        ))}
      <line x1={cx} y1={PAD_TOP} x2={cx} y2={golferY} stroke="#3b6929" strokeWidth={0.8} />

      {/* Yardage arcs */}
      {arcYards.map((d) => {
        const r = d * scale;
        const halfSpan = Math.min(d, displayMaxOffline);
        const x1 = toX(-halfSpan);
        const x2 = toX(halfSpan);
        const y1 = toY(Math.sqrt(Math.max(0, d * d - halfSpan * halfSpan)));
        const path = `M ${x1} ${y1} A ${r} ${r} 0 0 0 ${x2} ${y1}`;
        const labelY = toY(d);

        return (
          <g key={d}>
            <path d={path} stroke="#3b6929" strokeWidth={0.75} fill="none" />
            <line
              x1={cx - 3}
              y1={labelY}
              x2={cx + 3}
              y2={labelY}
              stroke="#3b6929"
              strokeWidth={0.75}
            />
            <text
              x={PAD_SIDE - 3}
              y={labelY}
              textAnchor="end"
              fontSize={7}
              dominantBaseline="middle"
              fill="rgba(255,255,255,0.55)"
            >
              {d}
            </text>
          </g>
        );
      })}

      {/* Dispersion ellipse */}
      <ellipse
        cx={toX(meanOff)}
        cy={toY(meanCarry)}
        rx={ellipseRx}
        ry={ellipseRy}
        stroke="white"
        strokeWidth={1.5}
        fill="rgba(255,255,255,0.06)"
      />

      {/* Other shots */}
      {shots
        .filter((s) => s !== currentShot)
        .map((s, i) => (
          <circle
            key={i}
            cx={toX(s.offline)}
            cy={toY(s.carry)}
            r={2.5}
            fill="white"
            opacity={0.8}
          />
        ))}

      {/* Current shot */}
      <circle cx={toX(currentShot.offline)} cy={toY(currentShot.carry)} r={4} fill="#facc15" />
      <text
        x={toX(currentShot.offline)}
        y={toY(currentShot.carry) - 7}
        textAnchor="middle"
        fontSize={7}
        fontWeight="bold"
        fill="#facc15"
      >
        #{currentShot.index}
      </text>

      {/* Golfer origin dot */}
      <circle cx={cx} cy={golferY} r={2} fill="white" opacity={0.55} />

      {/* Bottom offline labels */}
      {[-displayMaxOffline, -displayMaxOffline / 2, displayMaxOffline / 2, displayMaxOffline].map(
        (off) => (
          <text
            key={off}
            x={toX(off)}
            y={SVG_H - 4}
            textAnchor="middle"
            fontSize={6}
            fill="rgba(255,255,255,0.45)"
          >
            {Math.abs(off)}
            {off < 0 ? "L" : "R"}
          </text>
        )
      )}
    </svg>
  );
}
