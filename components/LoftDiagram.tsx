"use client";

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

const SIDE_CONFIGS: Record<string, SideConfig> = {
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

function getConfig(club: string): SideConfig {
  const c = club.toLowerCase().replace(/\s+/g, "");
  if (c.includes("driver")) return SIDE_CONFIGS["driver"];
  if (c.includes("3wood") || c === "3w") return SIDE_CONFIGS["3wood"];
  if (c.includes("4iron") || c === "4i") return SIDE_CONFIGS["4iron"];
  if (c.includes("7iron") || c === "7i") return SIDE_CONFIGS["7iron"];
  if (c.includes("9iron") || c === "9i") return SIDE_CONFIGS["9iron"];
  if (c.includes("pw") || c.includes("pitching")) return SIDE_CONFIGS["pw"];
  if (c.includes("iron") || c.includes("wedge")) return SIDE_CONFIGS["7iron"];
  return SIDE_CONFIGS["driver"];
}

export function LoftDiagram({
  launchAngle,
  dynamicLoft,
  attackAngle,
  club,
}: Props) {
  const cfg = getConfig(club);
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
    <svg
      viewBox="-200 -140 400 320"
      className="w-full"
      aria-label={`Launch ${launchAngle.toFixed(1)}°, Loft ${dynamicLoft.toFixed(1)}°, AoA ${attackAngle.toFixed(1)}°`}
    >
      <defs>
        <filter id="drop-shadow-dl">
          <feDropShadow
            dx="0"
            dy="2"
            stdDeviation="3"
            floodColor="black"
            floodOpacity="0.5"
          />
        </filter>
      </defs>

      {/* Club: leading edge at (0,0) */}
      <image
        href={`/faces/${cfg.image}`}
        x={imgX}
        y={imgY}
        width={imgW}
        height={imgH}
      />

      {/* Ground */}
      <line
        x1="-200"
        y1="0"
        x2="200"
        y2="0"
        strokeWidth={4}
        opacity={0.1}
        stroke="currentColor"
      />

      {/* Attack angle (orange) — right-going line rotated by attackAngle */}
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

      {/* Dynamic loft (yellow) — vertical line rotated by dynamicLoft */}
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

      {/* Launch angle (green) — left-going line rotated by launchAngle */}
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

      {/* Ball */}
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

      {/* Label names */}
      <text fontWeight="bold" textAnchor="middle" fontSize={18} fill="#f97316">
        <tspan x="130" y="95">
          Angle of
        </tspan>
        <tspan x="130" y="125">
          Attack
        </tspan>
      </text>
      <text fontWeight="bold" textAnchor="middle" fontSize={18} fill="#eab308">
        <tspan x="0" y="95">
          Dynamic
        </tspan>
        <tspan x="0" y="125">
          Loft
        </tspan>
      </text>
      <text fontWeight="bold" textAnchor="middle" fontSize={18} fill="#22c55e">
        <tspan x="-130" y="95">
          Vertical
        </tspan>
        <tspan x="-130" y="125">
          Launch
        </tspan>
      </text>

      {/* Label values */}
      <text
        x="130"
        y="160"
        textAnchor="middle"
        fontSize={24}
        dominantBaseline="text-after-edge"
        fontWeight="bold"
        style={{ fill: "var(--secondary-foreground)" }}
      >
        {aoaLabel}
      </text>
      <text
        x="0"
        y="160"
        textAnchor="middle"
        fontSize={24}
        dominantBaseline="text-after-edge"
        fontWeight="bold"
        style={{ fill: "var(--secondary-foreground)" }}
      >
        {dynamicLoft.toFixed(1)}°
      </text>
      <text
        x="-130"
        y="160"
        textAnchor="middle"
        fontSize={24}
        dominantBaseline="text-after-edge"
        fontWeight="bold"
        style={{ fill: "var(--secondary-foreground)" }}
      >
        {launchAngle.toFixed(1)}°
      </text>
    </svg>
  );
}
