"use client";

const DEG = Math.PI / 180;

interface Props {
  launchDirection: number;
  faceAngle: number;
  clubPath: number;
  club: string;
}

import { resolveClubKey, type ClubKey } from "@/lib/clubKey";

interface TopConfig {
  image: string;
  imgX: number;
}

// imgX: left edge of 200×200 display box in SVG coords.
// Calibrated so the face left edge is ~50 SVG units left of impact (0,-20).
const TOP_CONFIGS: Record<ClubKey, TopConfig> = {
  driver: { image: "Driver_Top.png", imgX: -51 },
  "3wood": { image: "3Wood_Top.png", imgX: -51 },
  "4iron": { image: "4Iron_Top.png", imgX: -61 },
  "7iron": { image: "7Iron_Top.png", imgX: -60 },
  "9iron": { image: "9Iron_Top.png", imgX: -57 },
  pw: { image: "PitchingWedge_Top.png", imgX: -56 },
};

function fmtDir(n: number): string {
  if (n === 0) return "0°";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}°`;
}

export function FaceToPath({ launchDirection, faceAngle, clubPath, club }: Props) {
  const cfg = TOP_CONFIGS[resolveClubKey(club)];
  const LINE = 150;
  const REF_Y = -20; // y of reference line / impact point
  const ballR = 25;
  const facePath = faceAngle - clubPath;

  // Ball at end of green launch line, rotated around impact (0, REF_Y)
  const ballX = -LINE * Math.cos(launchDirection * DEG);
  const ballY = REF_Y - LINE * Math.sin(launchDirection * DEG);

  return (
    <div
      aria-label={`Launch ${fmtDir(launchDirection)}, Face to Path ${fmtDir(facePath)}, Club Path ${fmtDir(clubPath)}`}
    >
      <svg viewBox="-200 -100 400 210" className="w-full">
        <defs>
          <filter id="drop-shadow-ftp">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodColor="black" floodOpacity="0.5" />
          </filter>
        </defs>

        <image
          href={`/faces/${cfg.image}`}
          x={cfg.imgX}
          y={-100}
          width={200}
          height={200}
          filter="url(#drop-shadow-ftp)"
        />

        <line
          x1="-200"
          y1={REF_Y}
          x2="200"
          y2={REF_Y}
          strokeWidth={4}
          opacity={0.1}
          stroke="currentColor"
        />

        <line
          x1="0"
          y1={REF_Y}
          x2={-LINE}
          y2={REF_Y}
          strokeWidth={4}
          stroke="#22c55e"
          style={{
            transform: `rotate(${launchDirection}deg)`,
            transformOrigin: "100% 0%",
            transformBox: "fill-box",
          }}
        />

        <line
          x1="0"
          y1={REF_Y}
          x2={LINE}
          y2={REF_Y}
          strokeWidth={4}
          stroke="#f97316"
          style={{
            transform: `rotate(${clubPath}deg)`,
            transformOrigin: "0% 0%",
            transformBox: "fill-box",
          }}
        />

        <line
          x1="0"
          y1={REF_Y - 50}
          x2="0"
          y2={REF_Y + 50}
          strokeWidth={4}
          stroke="#eab308"
          style={{
            transform: `rotate(${facePath}deg)`,
            transformOrigin: "0% 50%",
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
            Horizontal Launch
          </p>
          <p className="text-sm font-bold">{fmtDir(launchDirection)}</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#eab308" }}>
            Face to Club Path
          </p>
          <p className="text-sm font-bold">{fmtDir(facePath)}</p>
        </div>
        <div>
          <p className="text-xs font-bold" style={{ color: "#f97316" }}>
            Club Path
          </p>
          <p className="text-sm font-bold">{fmtDir(clubPath)}</p>
        </div>
      </div>
    </div>
  );
}
