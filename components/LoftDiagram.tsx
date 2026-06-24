"use client";

import { resolveClubKey, type ClubKey } from "@/lib/clubKey";

const DEG = Math.PI / 180;

interface Props {
  launchAngle: number;
  dynamicLoft: number;
  attackAngle: number;
  club: string;
}

interface SideConfig {
  image: string;
  origW: number;
  leX: number;
  leY: number;
  scale: number;
}

const SIDE_CONFIGS: Record<ClubKey, SideConfig> = {
  driver: {
    image: "Driver_Side_2.png",
    origW: 556,
    leX: 108,
    leY: 453,
    scale: 0.28,
  },
  "3wood": {
    image: "3Wood_Side_2.png",
    origW: 519,
    leX: 159,
    leY: 447,
    scale: 0.28,
  },
  "4iron": {
    image: "4Iron_Side_2.png",
    origW: 128,
    leX: 38,
    leY: 438,
    scale: 0.4,
  },
  "7iron": {
    image: "7Iron_Side_2.png",
    origW: 158,
    leX: 0,
    leY: 330,
    scale: 0.4,
  },
  "9iron": {
    image: "9Iron_Side_2.png",
    origW: 194,
    leX: 56,
    leY: 442,
    scale: 0.4,
  },
  pw: {
    image: "PitchingWedge_Side_2.png",
    origW: 158,
    leX: 0,
    leY: 330,
    scale: 0.4,
  },
};

export function LoftDiagram({ launchAngle, dynamicLoft, attackAngle, club }: Props) {
  const cfg = SIDE_CONFIGS[resolveClubKey(club)];
  const LINE = 150;
  const LO = 50;

  // Pin leading edge to (0,0)
  const imgX = -cfg.leX * cfg.scale;
  const imgY = -cfg.leY * cfg.scale;
  const imgW = cfg.origW * cfg.scale;
  const imgH = 460 * cfg.scale;

  // Ball centre = end of launch line
  const ballX = -LINE * Math.cos(launchAngle * DEG);
  const ballY = -LINE * Math.sin(launchAngle * DEG);
  const ballR = 30;

  const aoaLabel = `${attackAngle > 0 ? "+" : ""}${attackAngle.toFixed(1)}°`;

  return (
    <div
      aria-label={`Launch ${launchAngle.toFixed(1)}°, Loft ${dynamicLoft.toFixed(1)}°, AoA ${attackAngle.toFixed(1)}°`}
    >
      <svg viewBox="-200 -140 400 210" className="w-full">
        <defs>
          <filter id="drop-shadow-dl">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.5" />
          </filter>
        </defs>

        <image href={`/faces/${cfg.image}`} x={imgX} y={imgY} width={imgW} height={imgH} />

        <line
          x1="-200"
          y1="0"
          x2="200"
          y2="0"
          strokeWidth={4}
          opacity={0.1}
          stroke="currentColor"
        />

        <line
          x1="0"
          y1="0"
          x2={LINE}
          y2="0"
          strokeWidth={4}
          stroke="#f97316"
          style={{
            transform: `rotate(${attackAngle}deg)`,
            transformOrigin: "0% 0%",
            transformBox: "fill-box",
          }}
        />

        <line
          x1="0"
          y1={-LO}
          x2="0"
          y2={LO}
          strokeWidth={4}
          stroke="#eab308"
          style={{
            transform: `rotate(${dynamicLoft}deg)`,
            transformOrigin: "0% 50%",
            transformBox: "fill-box",
          }}
        />

        <line
          x1="0"
          y1="0"
          x2={-LINE}
          y2="0"
          strokeWidth={4}
          stroke="#22c55e"
          style={{
            transform: `rotate(${launchAngle}deg)`,
            transformOrigin: "100% 0%",
            transformBox: "fill-box",
          }}
        />

        <image
          href="/balls/RealGolfBall.png"
          x={-ballR}
          y={-ballR}
          width={ballR * 2}
          height={ballR * 2}
          style={{
            transform: `translateX(${ballX}px) translateY(${ballY}px)`,
            transformOrigin: "50% 50%",
            transformBox: "fill-box",
          }}
        />
      </svg>

      <div className="grid grid-cols-3 text-center mt-2">
        <div>
          <p className="text-xs font-bold" style={{ color: "#22c55e" }}>
            Launch Angle
          </p>
          <p className="text-sm font-bold">{launchAngle.toFixed(1)}°</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#eab308" }}>
            Dynamic Loft
          </p>
          <p className="text-sm font-bold">{dynamicLoft.toFixed(1)}°</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#f97316" }}>
            Angle of Attack
          </p>
          <p className="text-sm font-bold">{aoaLabel}</p>
        </div>
      </div>
    </div>
  );
}
