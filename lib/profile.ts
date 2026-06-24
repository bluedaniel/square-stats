export type IdealRange = { min?: number; max?: number };

export type ClubStatKey =
  | "carry"
  | "total"
  | "apex"
  | "offline"
  | "clubSpeed"
  | "ballSpeed"
  | "smashFactor"
  | "launchAngle"
  | "launchDirection"
  | "landingAngle"
  | "attackAngle"
  | "dynamicLoft"
  | "spinRate"
  | "spinAxis"
  | "backSpin"
  | "sideSpin"
  | "clubPath"
  | "faceAngle"
  | "impactHorizontal"
  | "impactVertical";

export const CLUB_STAT_META: Record<ClubStatKey, { label: string; unit: string }> = {
  carry: { label: "Carry", unit: "yd" },
  total: { label: "Total", unit: "yd" },
  apex: { label: "Apex", unit: "yd" },
  offline: { label: "Offline", unit: "yd" },
  clubSpeed: { label: "Club Speed", unit: "mph" },
  ballSpeed: { label: "Ball Speed", unit: "mph" },
  smashFactor: { label: "Smash Factor", unit: "" },
  launchAngle: { label: "Launch Angle", unit: "°" },
  launchDirection: { label: "Launch Direction", unit: "°" },
  landingAngle: { label: "Landing Angle", unit: "°" },
  attackAngle: { label: "Attack Angle", unit: "°" },
  dynamicLoft: { label: "Dynamic Loft", unit: "°" },
  spinRate: { label: "Spin Rate", unit: "rpm" },
  spinAxis: { label: "Spin Axis", unit: "°" },
  backSpin: { label: "Back Spin", unit: "rpm" },
  sideSpin: { label: "Side Spin", unit: "rpm" },
  clubPath: { label: "Club Path", unit: "°" },
  faceAngle: { label: "Face Angle", unit: "°" },
  impactHorizontal: { label: "Impact H", unit: "" },
  impactVertical: { label: "Impact V", unit: "" },
};

export const CLUB_STAT_KEYS = Object.keys(CLUB_STAT_META) as ClubStatKey[];

export interface BagClub {
  id: string;
  label: string;
  makeModel: string;
  targetCarry: number | null;
  ideals: Partial<Record<ClubStatKey, IdealRange>>;
  aliases?: string[]; // explicit CSV club names that map to this club
}

export const HANDICAP_OPTIONS = [
  "Scratch (0)",
  "1 – 5",
  "6 – 10",
  "11 – 15",
  "16 – 20",
  "21 – 28",
  "28+",
] as const;

export type Handicap = (typeof HANDICAP_OPTIONS)[number];

export interface UserProfile {
  name: string;
  handicap: Handicap | "";
  bag: BagClub[];
}

const LS_KEY = "profile";

export function loadProfile(): UserProfile {
  try {
    const raw = typeof window !== "undefined" && localStorage.getItem(LS_KEY);
    if (raw) {
      const p = JSON.parse(raw) as UserProfile;
      return { ...p, bag: p.bag.map((c) => ({ ...c, ideals: c.ideals ?? {} })) };
    }
  } catch {}
  return { name: "", handicap: "", bag: [] };
}

export function saveProfile(profile: UserProfile): void {
  localStorage.setItem(LS_KEY, JSON.stringify(profile));
  saveTauri(profile);
}

// ─── Tauri persistence (appDataDir survives app updates) ─────────────────────

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

async function getProfilePath(): Promise<string | null> {
  if (!isTauri) return null;
  try {
    const { appDataDir, join } = await import("@tauri-apps/api/path");
    return join(await appDataDir(), "profile.json");
  } catch {
    return null;
  }
}

function saveTauri(profile: UserProfile): void {
  if (!isTauri) return;
  (async () => {
    const path = await getProfilePath();
    if (!path) return;
    const { invoke } = await import("@tauri-apps/api/core");
    await invoke("write_file", { path, content: JSON.stringify(profile) });
  })();
}

// Called once on app boot. If localStorage is empty (e.g. after an update
// cleared WebView data), restores profile from the persistent file.
export async function syncProfileFromTauri(): Promise<void> {
  if (!isTauri) return;
  if (typeof window === "undefined" || localStorage.getItem(LS_KEY)) return;
  try {
    const path = await getProfilePath();
    if (!path) return;
    const { invoke } = await import("@tauri-apps/api/core");
    const content = await invoke<string>("read_file", { path });
    localStorage.setItem(LS_KEY, content);
  } catch {} // file not found on first launch — that's fine
}

const ABBREV: Record<string, string> = {
  pw: "pitchingwedge",
  gw: "gapwedge",
  sw: "sandwedge",
  lw: "lobwedge",
};

function normClub(s: string): string {
  const n = s.toLowerCase().replace(/[\s-]+/g, "");
  return ABBREV[n] ?? n;
}

export function findBagClub(shotClub: string, bag: BagClub[]): BagClub | undefined {
  const key = normClub(shotClub);
  return (
    bag.find((c) => c.aliases?.some((a) => normClub(a) === key)) ??
    bag.find((c) => normClub(c.label) === key)
  );
}

export function csvToLabel(club: string): string {
  const abbrevs: Record<string, string> = {
    pw: "Pitching Wedge",
    gw: "Gap Wedge",
    sw: "Sand Wedge",
    lw: "Lob Wedge",
    minidriver: "Mini Driver",
  };
  const norm = club.toLowerCase().replace(/\s+/g, "");
  if (abbrevs[norm]) return abbrevs[norm];
  return club.replace(/(\d)([A-Za-z])/g, "$1 $2").replace(/([a-z])([A-Z])/g, "$1 $2");
}

export function profileStatStatus(
  club: BagClub | undefined,
  key: ClubStatKey,
  value: number | undefined | null
): "good" | "bad" | undefined {
  if (!club || value == null) return undefined;
  const range = club.ideals[key];
  if (!range || (range.min == null && range.max == null)) return undefined;
  const tooLow = range.min != null && value < range.min;
  const tooHigh = range.max != null && value > range.max;
  return tooLow || tooHigh ? "bad" : "good";
}

// ─── Default ideals ───────────────────────────────────────────────────────────

type R = [number | null, number | null]; // [min, max] — null = no bound

// 7 handicap bands: scratch | 1-5 | 6-10 | 11-15 | 16-20 | 21-28 | 28+
type Bands = [R, R, R, R, R, R, R];

type ClubCategory =
  | "driver"
  | "wood"
  | "hybrid"
  | "long-iron"
  | "mid-iron"
  | "short-iron"
  | "wedge"
  | "putter";

function handicapBandIndex(h: Handicap | ""): number {
  switch (h) {
    case "Scratch (0)":
      return 0;
    case "1 – 5":
      return 1;
    case "6 – 10":
      return 2;
    case "11 – 15":
      return 3;
    case "16 – 20":
      return 4;
    case "21 – 28":
      return 5;
    case "28+":
      return 6;
    default:
      return 3;
  }
}

// Columns: scratch | 1-5 | 6-10 | 11-15 | 16-20 | 21-28 | 28+
const DEFAULTS: Record<ClubCategory, Partial<Record<ClubStatKey, Bands>>> = {
  driver: {
    carry: [
      [255, null],
      [240, null],
      [225, null],
      [210, null],
      [195, null],
      [178, null],
      [160, null],
    ],
    total: [
      [275, null],
      [258, null],
      [242, null],
      [225, null],
      [209, null],
      [191, null],
      [172, null],
    ],
    apex: [
      [90, 115],
      [84, 108],
      [78, 101],
      [72, 94],
      [66, 87],
      [60, 80],
      [53, 73],
    ],
    clubSpeed: [
      [103, null],
      [98, null],
      [93, null],
      [88, null],
      [83, null],
      [78, null],
      [72, null],
    ],
    ballSpeed: [
      [148, null],
      [140, null],
      [132, null],
      [124, null],
      [116, null],
      [108, null],
      [98, null],
    ],
    smashFactor: [
      [1.43, null],
      [1.42, null],
      [1.41, null],
      [1.4, null],
      [1.38, null],
      [1.36, null],
      [1.32, null],
    ],
    launchAngle: [
      [10, 15],
      [10, 16],
      [11, 17],
      [12, 18],
      [13, 19],
      [14, 20],
      [15, 22],
    ],
    landingAngle: [
      [35, 44],
      [36, 45],
      [37, 46],
      [38, 47],
      [39, 48],
      [40, 49],
      [41, 50],
    ],
    attackAngle: [
      [-4, 0],
      [-4, 1],
      [-3, 2],
      [-2, 3],
      [-1, 4],
      [0, 5],
      [0, 6],
    ],
    dynamicLoft: [
      [11, 17],
      [12, 18],
      [13, 19],
      [14, 20],
      [15, 21],
      [16, 22],
      [17, 23],
    ],
    spinRate: [
      [2000, 2800],
      [2200, 3000],
      [2400, 3200],
      [2600, 3400],
      [2800, 3600],
      [3000, 3800],
      [3200, 4200],
    ],
    backSpin: [
      [1800, 2600],
      [2000, 2800],
      [2200, 3000],
      [2400, 3200],
      [2600, 3400],
      [2800, 3600],
      [3000, 3900],
    ],
  },
  wood: {
    carry: [
      [230, null],
      [215, null],
      [202, null],
      [188, null],
      [175, null],
      [162, null],
      [145, null],
    ],
    total: [
      [246, null],
      [230, null],
      [216, null],
      [201, null],
      [187, null],
      [173, null],
      [155, null],
    ],
    apex: [
      [78, 100],
      [72, 93],
      [67, 87],
      [62, 81],
      [57, 75],
      [52, 69],
      [46, 62],
    ],
    clubSpeed: [
      [100, null],
      [95, null],
      [90, null],
      [85, null],
      [80, null],
      [75, null],
      [69, null],
    ],
    ballSpeed: [
      [142, null],
      [134, null],
      [126, null],
      [118, null],
      [110, null],
      [101, null],
      [91, null],
    ],
    smashFactor: [
      [1.41, null],
      [1.4, null],
      [1.39, null],
      [1.38, null],
      [1.36, null],
      [1.34, null],
      [1.3, null],
    ],
    launchAngle: [
      [11, 16],
      [11, 17],
      [12, 18],
      [13, 19],
      [14, 20],
      [15, 21],
      [16, 23],
    ],
    landingAngle: [
      [38, 47],
      [39, 48],
      [40, 49],
      [41, 50],
      [42, 51],
      [43, 52],
      [44, 53],
    ],
    attackAngle: [
      [-3, 1],
      [-3, 2],
      [-2, 2],
      [-1, 3],
      [0, 4],
      [0, 5],
      [1, 6],
    ],
    dynamicLoft: [
      [14, 20],
      [15, 21],
      [16, 22],
      [17, 23],
      [18, 24],
      [19, 25],
      [20, 26],
    ],
    spinRate: [
      [2600, 3400],
      [2800, 3600],
      [3000, 3800],
      [3200, 4000],
      [3400, 4200],
      [3600, 4400],
      [3800, 4800],
    ],
    backSpin: [
      [2400, 3200],
      [2600, 3400],
      [2800, 3600],
      [3000, 3800],
      [3200, 4000],
      [3400, 4200],
      [3600, 4600],
    ],
  },
  hybrid: {
    carry: [
      [210, null],
      [196, null],
      [183, null],
      [170, null],
      [157, null],
      [144, null],
      [128, null],
    ],
    total: [
      [222, null],
      [207, null],
      [194, null],
      [180, null],
      [166, null],
      [152, null],
      [135, null],
    ],
    apex: [
      [70, 90],
      [65, 84],
      [60, 78],
      [55, 72],
      [50, 66],
      [45, 60],
      [40, 54],
    ],
    clubSpeed: [
      [96, null],
      [91, null],
      [86, null],
      [81, null],
      [76, null],
      [71, null],
      [65, null],
    ],
    ballSpeed: [
      [133, null],
      [124, null],
      [116, null],
      [108, null],
      [100, null],
      [92, null],
      [83, null],
    ],
    smashFactor: [
      [1.38, null],
      [1.37, null],
      [1.36, null],
      [1.35, null],
      [1.33, null],
      [1.31, null],
      [1.28, null],
    ],
    launchAngle: [
      [13, 18],
      [13, 19],
      [14, 20],
      [15, 21],
      [16, 22],
      [17, 23],
      [18, 25],
    ],
    landingAngle: [
      [42, 51],
      [43, 52],
      [44, 53],
      [45, 54],
      [46, 55],
      [47, 56],
      [48, 57],
    ],
    attackAngle: [
      [-4, -1],
      [-4, 0],
      [-3, 0],
      [-3, 1],
      [-2, 2],
      [-1, 3],
      [0, 4],
    ],
    dynamicLoft: [
      [18, 24],
      [19, 25],
      [20, 26],
      [21, 27],
      [22, 28],
      [23, 29],
      [24, 30],
    ],
    spinRate: [
      [3800, 4800],
      [4000, 5000],
      [4200, 5200],
      [4500, 5500],
      [4700, 5800],
      [5000, 6200],
      [5200, 6600],
    ],
    backSpin: [
      [3600, 4600],
      [3800, 4800],
      [4000, 5000],
      [4300, 5300],
      [4500, 5600],
      [4800, 6000],
      [5000, 6400],
    ],
  },
  "long-iron": {
    carry: [
      [195, null],
      [182, null],
      [169, null],
      [157, null],
      [144, null],
      [132, null],
      [116, null],
    ],
    total: [
      [205, null],
      [191, null],
      [178, null],
      [165, null],
      [151, null],
      [139, null],
      [122, null],
    ],
    apex: [
      [62, 80],
      [57, 74],
      [53, 69],
      [48, 63],
      [44, 58],
      [40, 53],
      [35, 47],
    ],
    clubSpeed: [
      [92, null],
      [87, null],
      [82, null],
      [77, null],
      [72, null],
      [67, null],
      [61, null],
    ],
    ballSpeed: [
      [128, null],
      [120, null],
      [112, null],
      [104, null],
      [96, null],
      [88, null],
      [79, null],
    ],
    smashFactor: [
      [1.38, null],
      [1.37, null],
      [1.36, null],
      [1.35, null],
      [1.33, null],
      [1.31, null],
      [1.28, null],
    ],
    launchAngle: [
      [14, 19],
      [14, 20],
      [15, 21],
      [16, 22],
      [17, 23],
      [18, 24],
      [19, 26],
    ],
    landingAngle: [
      [44, 53],
      [45, 54],
      [46, 55],
      [47, 56],
      [48, 57],
      [49, 58],
      [50, 59],
    ],
    attackAngle: [
      [-5, -2],
      [-5, -1],
      [-4, -1],
      [-4, 0],
      [-3, 1],
      [-2, 2],
      [-1, 3],
    ],
    dynamicLoft: [
      [18, 24],
      [19, 25],
      [20, 26],
      [21, 27],
      [22, 28],
      [23, 29],
      [24, 30],
    ],
    spinRate: [
      [5000, 6200],
      [5200, 6400],
      [5500, 6800],
      [5800, 7200],
      [6200, 7600],
      [6500, 8000],
      [7000, 8600],
    ],
    backSpin: [
      [4800, 6000],
      [5000, 6200],
      [5300, 6600],
      [5600, 7000],
      [6000, 7400],
      [6300, 7800],
      [6800, 8400],
    ],
  },
  "mid-iron": {
    carry: [
      [178, null],
      [166, null],
      [155, null],
      [143, null],
      [131, null],
      [119, null],
      [104, null],
    ],
    total: [
      [186, null],
      [174, null],
      [162, null],
      [150, null],
      [137, null],
      [125, null],
      [109, null],
    ],
    apex: [
      [55, 72],
      [51, 67],
      [47, 62],
      [43, 57],
      [39, 52],
      [35, 47],
      [31, 42],
    ],
    clubSpeed: [
      [88, null],
      [83, null],
      [78, null],
      [73, null],
      [68, null],
      [63, null],
      [57, null],
    ],
    ballSpeed: [
      [122, null],
      [114, null],
      [106, null],
      [98, null],
      [90, null],
      [82, null],
      [73, null],
    ],
    smashFactor: [
      [1.37, null],
      [1.36, null],
      [1.35, null],
      [1.34, null],
      [1.32, null],
      [1.3, null],
      [1.27, null],
    ],
    launchAngle: [
      [16, 21],
      [16, 22],
      [17, 23],
      [18, 24],
      [19, 25],
      [20, 26],
      [21, 28],
    ],
    landingAngle: [
      [46, 55],
      [47, 56],
      [48, 57],
      [49, 58],
      [50, 59],
      [51, 60],
      [52, 61],
    ],
    attackAngle: [
      [-5, -2],
      [-5, -1],
      [-4, -1],
      [-4, 0],
      [-3, 1],
      [-2, 2],
      [-1, 3],
    ],
    dynamicLoft: [
      [22, 28],
      [23, 29],
      [24, 30],
      [25, 31],
      [26, 32],
      [27, 33],
      [28, 34],
    ],
    spinRate: [
      [6200, 7600],
      [6500, 8000],
      [6800, 8400],
      [7200, 8800],
      [7600, 9400],
      [8000, 9800],
      [8400, 10600],
    ],
    backSpin: [
      [6000, 7400],
      [6300, 7800],
      [6600, 8200],
      [7000, 8600],
      [7400, 9200],
      [7800, 9600],
      [8200, 10400],
    ],
  },
  "short-iron": {
    carry: [
      [162, null],
      [151, null],
      [140, null],
      [129, null],
      [118, null],
      [107, null],
      [92, null],
    ],
    total: [
      [168, null],
      [157, null],
      [146, null],
      [134, null],
      [123, null],
      [111, null],
      [96, null],
    ],
    apex: [
      [48, 64],
      [44, 59],
      [41, 55],
      [37, 51],
      [34, 47],
      [31, 43],
      [27, 38],
    ],
    clubSpeed: [
      [84, null],
      [79, null],
      [74, null],
      [69, null],
      [64, null],
      [59, null],
      [53, null],
    ],
    ballSpeed: [
      [114, null],
      [106, null],
      [98, null],
      [90, null],
      [83, null],
      [75, null],
      [66, null],
    ],
    smashFactor: [
      [1.35, null],
      [1.34, null],
      [1.33, null],
      [1.32, null],
      [1.3, null],
      [1.28, null],
      [1.25, null],
    ],
    launchAngle: [
      [18, 24],
      [18, 25],
      [19, 26],
      [20, 27],
      [21, 28],
      [22, 29],
      [23, 31],
    ],
    landingAngle: [
      [48, 57],
      [49, 58],
      [50, 59],
      [51, 60],
      [52, 61],
      [53, 62],
      [54, 63],
    ],
    attackAngle: [
      [-6, -3],
      [-6, -2],
      [-5, -2],
      [-5, -1],
      [-4, 0],
      [-3, 1],
      [-2, 2],
    ],
    dynamicLoft: [
      [26, 32],
      [27, 33],
      [28, 34],
      [29, 35],
      [30, 36],
      [31, 37],
      [32, 38],
    ],
    spinRate: [
      [7200, 8800],
      [7600, 9200],
      [8000, 9600],
      [8400, 10200],
      [8800, 10800],
      [9200, 11400],
      [9600, 12200],
    ],
    backSpin: [
      [7000, 8600],
      [7400, 9000],
      [7800, 9400],
      [8200, 10000],
      [8600, 10600],
      [9000, 11200],
      [9400, 12000],
    ],
  },
  wedge: {
    carry: [
      [100, null],
      [90, null],
      [82, null],
      [74, null],
      [66, null],
      [58, null],
      [50, null],
    ],
    total: [
      [103, null],
      [93, null],
      [85, null],
      [77, null],
      [69, null],
      [60, null],
      [52, null],
    ],
    apex: [
      [28, 44],
      [25, 40],
      [23, 37],
      [21, 34],
      [19, 31],
      [17, 28],
      [15, 25],
    ],
    clubSpeed: [
      [78, null],
      [73, null],
      [68, null],
      [63, null],
      [58, null],
      [53, null],
      [48, null],
    ],
    ballSpeed: [
      [104, null],
      [96, null],
      [88, null],
      [80, null],
      [72, null],
      [65, null],
      [57, null],
    ],
    smashFactor: [
      [1.3, null],
      [1.29, null],
      [1.28, null],
      [1.27, null],
      [1.25, null],
      [1.23, null],
      [1.2, null],
    ],
    launchAngle: [
      [22, 30],
      [22, 31],
      [23, 32],
      [24, 33],
      [25, 34],
      [26, 35],
      [27, 37],
    ],
    landingAngle: [
      [52, 62],
      [53, 63],
      [54, 64],
      [55, 65],
      [56, 66],
      [57, 67],
      [58, 68],
    ],
    attackAngle: [
      [-7, -4],
      [-7, -3],
      [-6, -3],
      [-6, -2],
      [-5, -1],
      [-4, 0],
      [-3, 1],
    ],
    dynamicLoft: [
      [29, 37],
      [30, 38],
      [31, 39],
      [32, 40],
      [33, 41],
      [34, 42],
      [35, 43],
    ],
    spinRate: [
      [8000, 10000],
      [8400, 10600],
      [8800, 11200],
      [9400, 12000],
      [9800, 12800],
      [10400, 13600],
      [11000, 14600],
    ],
    backSpin: [
      [7800, 9800],
      [8200, 10400],
      [8600, 11000],
      [9200, 11800],
      [9600, 12600],
      [10200, 13400],
      [10800, 14400],
    ],
  },
  putter: {},
};

// Direction/accuracy stats vary by handicap only, not club type
const DIRECTION_DEFAULTS: Partial<Record<ClubStatKey, Bands>> = {
  offline: [
    [-10, 10],
    [-15, 15],
    [-20, 20],
    [-25, 25],
    [-30, 30],
    [-35, 35],
    [-45, 45],
  ],
  launchDirection: [
    [-2, 2],
    [-3, 3],
    [-4, 4],
    [-5, 5],
    [-6, 6],
    [-8, 8],
    [-10, 10],
  ],
  spinAxis: [
    [-5, 5],
    [-7, 7],
    [-9, 9],
    [-11, 11],
    [-13, 13],
    [-16, 16],
    [-20, 20],
  ],
  sideSpin: [
    [-400, 400],
    [-600, 600],
    [-800, 800],
    [-1000, 1000],
    [-1200, 1200],
    [-1500, 1500],
    [-2000, 2000],
  ],
  clubPath: [
    [-2, 3],
    [-3, 4],
    [-4, 5],
    [-5, 6],
    [-6, 7],
    [-7, 8],
    [-9, 10],
  ],
  faceAngle: [
    [-2, 2],
    [-3, 3],
    [-4, 4],
    [-5, 5],
    [-6, 6],
    [-8, 8],
    [-10, 10],
  ],
  impactHorizontal: [
    [-0.3, 0.3],
    [-0.4, 0.4],
    [-0.5, 0.5],
    [-0.6, 0.6],
    [-0.7, 0.7],
    [-0.8, 0.8],
    [-1.0, 1.0],
  ],
  impactVertical: [
    [-0.2, 0.4],
    [-0.3, 0.5],
    [-0.4, 0.6],
    [-0.5, 0.7],
    [-0.6, 0.8],
    [-0.7, 0.9],
    [-0.8, 1.0],
  ],
};

function detectClubCategory(label: string): ClubCategory {
  const l = label.toLowerCase();
  if (l.includes("putter")) return "putter";
  if (l.includes("wedge")) return "wedge";
  if (l.includes("driver")) return "driver";
  if (l.includes("wood")) return "wood";
  if (l.includes("hybrid")) return "hybrid";
  const ironMatch = l.match(/(\d+)\s*iron/);
  if (ironMatch) {
    const n = parseInt(ironMatch[1]);
    if (n <= 4) return "long-iron";
    if (n <= 6) return "mid-iron";
    return "short-iron";
  }
  return "mid-iron";
}

export function getDefaultIdeals(
  label: string,
  handicap: Handicap | ""
): Partial<Record<ClubStatKey, IdealRange>> {
  const category = detectClubCategory(label);
  const band = handicapBandIndex(handicap);
  const catDefaults = DEFAULTS[category];
  const result: Partial<Record<ClubStatKey, IdealRange>> = {};
  for (const key of CLUB_STAT_KEYS) {
    const bands = catDefaults[key] ?? DIRECTION_DEFAULTS[key];
    if (bands) {
      const [min, max] = bands[band];
      const range: IdealRange = {};
      if (min != null) range.min = min;
      if (max != null) range.max = max;
      if (range.min != null || range.max != null) result[key] = range;
    }
  }
  return result;
}
