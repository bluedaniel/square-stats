"use client";

interface Props {
  horizontal: number; // positive = toe (left in image), negative = heel (right in image)
  vertical: number;   // positive = above centre, negative = below
  club: string;
}

interface FaceConfig {
  image: string;
  cx: number;     // sweet spot x as fraction of image width
  cy: number;     // sweet spot y as fraction of image height
  scaleX: number; // image-fraction per mm (horizontal)
  scaleY: number; // image-fraction per mm (vertical)
}

// All Front.png images are 512×449px. Heel (hosel) is on the RIGHT, toe on LEFT.
// cy = top of face (V=0 reference). impactVertical is negative going down from there.
// Sweet spot cx/cy and scales measured from pixel analysis.
const FACE_CONFIGS: Record<string, FaceConfig> = {
  driver:  { image: "Driver_Front.png",        cx: 0.508, cy: 0.185, scaleX: 0.0075, scaleY: 0.0083 },
  "3wood": { image: "3Wood_Front.png",         cx: 0.527, cy: 0.298, scaleX: 0.0099, scaleY: 0.0069 },
  "4iron": { image: "4Iron_Front.png",         cx: 0.459, cy: 0.200, scaleX: 0.0132, scaleY: 0.0165 },
  "7iron": { image: "7Iron_Front.png",         cx: 0.439, cy: 0.227, scaleX: 0.0140, scaleY: 0.0161 },
  "9iron": { image: "9Iron_Front.png",         cx: 0.450, cy: 0.263, scaleX: 0.0145, scaleY: 0.0155 },
  "pw":    { image: "PitchingWedge_Front.png", cx: 0.422, cy: 0.265, scaleX: 0.0156, scaleY: 0.0158 },
};

function getConfig(club: string): FaceConfig {
  const c = club.toLowerCase().replace(/\s+/g, "");
  if (c.includes("driver"))                        return FACE_CONFIGS["driver"];
  if (c.includes("3wood") || c === "3w")           return FACE_CONFIGS["3wood"];
  if (c.includes("4iron") || c === "4i")           return FACE_CONFIGS["4iron"];
  if (c.includes("7iron") || c === "7i")           return FACE_CONFIGS["7iron"];
  if (c.includes("9iron") || c === "9i")           return FACE_CONFIGS["9iron"];
  if (c.includes("pw") || c.includes("pitching"))  return FACE_CONFIGS["pw"];
  // Fallback: irons → 7iron, woods/hybrids → driver
  if (c.includes("iron") || c.includes("wedge"))   return FACE_CONFIGS["7iron"];
  return FACE_CONFIGS["driver"];
}

function impactColor(h: number, v: number): string {
  const dist = Math.sqrt(h * h + v * v);
  if (dist < 8)  return "#22c55e";
  if (dist < 16) return "#eab308";
  return "#ef4444";
}

export function ImpactChart({ horizontal, vertical, club }: Props) {
  const cfg = getConfig(club);

  // Positive horizontal = toe = LEFT in image → decrease left%
  // Positive vertical = high = UP in image → decrease top%
  const leftPct = (cfg.cx - horizontal * cfg.scaleX) * 100;
  const topPct  = (cfg.cy - vertical   * cfg.scaleY) * 100;
  const clampedLeft = Math.max(5, Math.min(95, leftPct));
  const clampedTop  = Math.max(5, Math.min(95, topPct));

  const color = impactColor(horizontal, vertical);

  const hLabel = horizontal === 0 ? "Centre" : `${Math.abs(horizontal).toFixed(1)} mm ${horizontal > 0 ? "toe" : "heel"}`;
  const vLabel = vertical   === 0 ? "Centre" : `${Math.abs(vertical).toFixed(1)} mm ${vertical > 0 ? "high" : "low"}`;

  return (
    <div className="flex flex-col items-center gap-2">
      <p className="text-xs text-muted-foreground tabular-nums">
        {hLabel} · {vLabel}
      </p>
      <div
        className="relative select-none"
        style={{ width: 240, height: Math.round(240 * 449 / 512) }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={`/faces/${cfg.image}`}
          alt={`${club} club face`}
          width={240}
          height={Math.round(240 * 449 / 512)}
          draggable={false}
          style={{ display: "block", width: "100%", height: "100%", objectFit: "contain" }}
        />
        {/* glow ring */}
        <div style={{
          position: "absolute",
          left: `${clampedLeft}%`,
          top: `${clampedTop}%`,
          transform: "translate(-50%, -50%)",
          width: 28, height: 28, borderRadius: "50%",
          background: color, opacity: 0.3, pointerEvents: "none",
        }} />
        {/* dot */}
        <div style={{
          position: "absolute",
          left: `${clampedLeft}%`,
          top: `${clampedTop}%`,
          transform: "translate(-50%, -50%)",
          width: 14, height: 14, borderRadius: "50%",
          background: color,
          border: "2px solid rgba(255,255,255,0.75)",
          opacity: 0.9, pointerEvents: "none",
        }} />
      </div>
    </div>
  );
}
