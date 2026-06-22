export type IdealRange = { min: number; max: number };
export type StatKey =
  | "clubSpeed" | "ballSpeed" | "smashFactor"
  | "launchAngle" | "attackAngle" | "dynamicLoft"
  | "spinRate" | "backSpin" | "landingAngle";

export const STAT_LABELS: Record<StatKey, string> = {
  clubSpeed:    "Club Speed",
  ballSpeed:    "Ball Speed",
  smashFactor:  "Smash Factor",
  launchAngle:  "Launch Angle",
  attackAngle:  "Attack Angle",
  dynamicLoft:  "Dynamic Loft",
  spinRate:     "Spin Rate",
  backSpin:     "Back Spin",
  landingAngle: "Landing Angle",
};

export const STAT_KEYS = Object.keys(STAT_LABELS) as StatKey[];

export type ClubIdeals = Partial<Record<StatKey, IdealRange>>;
export type IdealsConfig = Record<string, ClubIdeals>;

export const CLUB_KEYS = ["driver", "3wood", "4iron", "7iron", "9iron", "pw"] as const;
export type ClubKey = typeof CLUB_KEYS[number];

export const CLUB_LABELS: Record<ClubKey, string> = {
  driver: "Driver", "3wood": "3 Wood", "4iron": "4 Iron",
  "7iron": "7 Iron", "9iron": "9 Iron", pw: "PW",
};

export const DEFAULT_IDEALS: IdealsConfig = {
  driver: {
    clubSpeed:    { min: 103, max: 112 },
    ballSpeed:    { min: 148, max: 163 },
    smashFactor:  { min: 1.42, max: 1.50 },
    launchAngle:  { min: 10,  max: 15  },
    attackAngle:  { min: -2,  max: 4   },
    dynamicLoft:  { min: 11,  max: 17  },
    spinRate:     { min: 2000, max: 3200 },
    backSpin:     { min: 1800, max: 3000 },
  },
  "3wood": {
    clubSpeed:    { min: 92,  max: 105 },
    ballSpeed:    { min: 130, max: 150 },
    smashFactor:  { min: 1.40, max: 1.48 },
    launchAngle:  { min: 10,  max: 15  },
    attackAngle:  { min: -3,  max: 2   },
    dynamicLoft:  { min: 14,  max: 20  },
    spinRate:     { min: 3000, max: 4500 },
  },
  "4iron": {
    clubSpeed:    { min: 83,  max: 95  },
    ballSpeed:    { min: 114, max: 132 },
    smashFactor:  { min: 1.37, max: 1.44 },
    launchAngle:  { min: 13,  max: 19  },
    attackAngle:  { min: -6,  max: -1  },
    dynamicLoft:  { min: 18,  max: 24  },
    spinRate:     { min: 4000, max: 5500 },
  },
  "7iron": {
    clubSpeed:    { min: 78,  max: 90  },
    ballSpeed:    { min: 107, max: 124 },
    smashFactor:  { min: 1.35, max: 1.42 },
    launchAngle:  { min: 16,  max: 22  },
    attackAngle:  { min: -6,  max: -1  },
    dynamicLoft:  { min: 22,  max: 28  },
    spinRate:     { min: 5500, max: 7500 },
  },
  "9iron": {
    clubSpeed:    { min: 73,  max: 85  },
    ballSpeed:    { min: 98,  max: 114 },
    smashFactor:  { min: 1.33, max: 1.40 },
    launchAngle:  { min: 20,  max: 27  },
    attackAngle:  { min: -7,  max: -2  },
    dynamicLoft:  { min: 26,  max: 33  },
    spinRate:     { min: 7000, max: 9500 },
  },
  pw: {
    clubSpeed:    { min: 70,  max: 82  },
    ballSpeed:    { min: 92,  max: 107 },
    smashFactor:  { min: 1.30, max: 1.38 },
    launchAngle:  { min: 22,  max: 30  },
    attackAngle:  { min: -8,  max: -2  },
    dynamicLoft:  { min: 29,  max: 37  },
    spinRate:     { min: 8000, max: 11000 },
  },
};

const LS_KEY = "ideals";

export function loadIdeals(): IdealsConfig {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem(LS_KEY);
    if (raw) return { ...DEFAULT_IDEALS, ...JSON.parse(raw) };
  } catch {}
  return DEFAULT_IDEALS;
}

export function saveIdeals(config: IdealsConfig): void {
  localStorage.setItem(LS_KEY, JSON.stringify(config));
}

export function resetIdeals(): IdealsConfig {
  localStorage.removeItem(LS_KEY);
  return DEFAULT_IDEALS;
}

function normalise(club: string): string {
  const c = club.toLowerCase().replace(/\s+/g, "");
  if (c.includes("driver")) return "driver";
  if (c.includes("3wood") || c === "3w") return "3wood";
  if (c.includes("4iron") || c === "4i") return "4iron";
  if (c.includes("7iron") || c === "7i") return "7iron";
  if (c.includes("9iron") || c === "9i") return "9iron";
  if (c.includes("pw") || c.includes("pitching")) return "pw";
  return "";
}

export function getIdeal(club: string, key: StatKey, config?: IdealsConfig): IdealRange | null {
  const src = config ?? DEFAULT_IDEALS;
  return src[normalise(club)]?.[key] ?? null;
}

export function statStatus(
  club: string,
  key: StatKey,
  value: number | undefined | null,
  config?: IdealsConfig,
): "good" | "bad" | undefined {
  if (value == null) return undefined;
  const range = getIdeal(club, key, config);
  if (!range) return undefined;
  return value >= range.min && value <= range.max ? "good" : "bad";
}
