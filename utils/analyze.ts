import type { Shot, ClubStats, SessionAnalysis, SessionMeta } from "@/types/shot";

function percentile(sorted: number[], p: number): number {
  if (!sorted.length) return 0;
  const idx = (p / 100) * (sorted.length - 1);
  const lo = Math.floor(idx);
  const hi = Math.ceil(idx);
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo);
}

function mean(vals: number[]): number {
  if (!vals.length) return 0;
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function median(vals: number[]): number {
  if (!vals.length) return 0;
  const sorted = [...vals].sort((a, b) => a - b);
  const mid = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
}

function stdDev(vals: number[]): number {
  if (vals.length < 2) return 0;
  const m = mean(vals);
  return Math.sqrt(vals.reduce((sum, v) => sum + (v - m) ** 2, 0) / vals.length);
}

// Detect outliers using Tukey fences (IQR × 1.5) on carry, per club.
// Returns a Set of array indices into the shots[] array.
export function detectOutliers(shots: Shot[]): Set<number> {
  const outliers = new Set<number>();
  const clubs = [...new Set(shots.map((s) => s.club))];

  for (const club of clubs) {
    const entries = shots.map((s, i) => ({ s, i })).filter(({ s }) => s.club === club);

    if (entries.length < 4) continue;

    const sorted = [...entries.map(({ s }) => s.carry)].sort((a, b) => a - b);
    const q1 = percentile(sorted, 25);
    const q3 = percentile(sorted, 75);
    const iqr = q3 - q1;
    const lower = q1 - 1.5 * iqr;
    const upper = q3 + 1.5 * iqr;

    entries.forEach(({ s, i }) => {
      if (s.carry < lower || s.carry > upper) outliers.add(i);
    });
  }

  return outliers;
}

export function recomputeClubStats(shots: Shot[]): ClubStats[] {
  const clubs = [...new Set(shots.map((s) => s.club))];
  return clubs.map((club) =>
    statsForClub(
      club,
      shots.filter((s) => s.club === club)
    )
  );
}

function statsForClub(club: string, shots: Shot[]): ClubStats {
  const smashes = shots.map((s) => s.smashFactor).filter((s) => s > 0);
  return {
    club,
    count: shots.length,
    avgCarry: mean(shots.map((s) => s.carry)),
    avgTotal: mean(shots.map((s) => s.total)),
    avgBallSpeed: mean(shots.map((s) => s.ballSpeed).filter((s) => s > 0)),
    avgClubSpeed: mean(shots.map((s) => s.clubSpeed).filter((s) => s > 0)),
    avgSmash: mean(smashes),
    medianSmash: median(smashes),
    avgSpinRate: mean(shots.map((s) => s.spinRate).filter((s) => s > 0)),
    avgOffline: mean(shots.map((s) => s.offline)),
    stdDevCarry: stdDev(shots.map((s) => s.carry)),
    stdDevOffline: stdDev(shots.map((s) => s.offline)),
  };
}

export function analyze(meta: SessionMeta, shots: Shot[]): SessionAnalysis {
  const clubs = [...new Set(shots.map((s) => s.club))];
  const clubStats = clubs.map((club) =>
    statsForClub(
      club,
      shots.filter((s) => s.club === club)
    )
  );

  const shotsWithSmash = shots.filter((s) => s.smashFactor > 0);
  const sessionMedianSmash = median(shotsWithSmash.map((s) => s.smashFactor));

  const modelShot = shotsWithSmash.reduce(
    (best, s) => (s.smashFactor > best.smashFactor ? s : best),
    shotsWithSmash[0] ?? shots[0]
  );

  const poorContactShots = new Set(
    shotsWithSmash.filter((s) => s.smashFactor < sessionMedianSmash - 0.1).map((s) => s.index)
  );

  const outlierIndices = detectOutliers(shots);

  return { meta, shots, clubStats, modelShot, poorContactShots, outlierIndices };
}

export function buildCarryHistogram(
  shots: Shot[],
  binSize = 5
): { range: string; count: number; binStart: number }[] {
  if (!shots.length) return [];
  const carries = shots.map((s) => s.carry);
  const min = Math.floor(Math.min(...carries) / binSize) * binSize;
  const max = Math.ceil(Math.max(...carries) / binSize) * binSize;
  const bins: { range: string; count: number; binStart: number }[] = [];
  for (let start = min; start < max; start += binSize) {
    const end = start + binSize;
    bins.push({
      binStart: start,
      range: `${start}–${end}`,
      count: carries.filter((c) => c >= start && c < end).length,
    });
  }
  return bins;
}

export function buildRollingAvg(
  shots: Shot[],
  getValue: (s: Shot) => number,
  window = 5
): { index: number; value: number; rolling: number }[] {
  return shots.map((s, i) => {
    const slice = shots.slice(Math.max(0, i - window + 1), i + 1);
    return {
      index: s.index,
      value: getValue(s),
      rolling: mean(slice.map(getValue)),
    };
  });
}
