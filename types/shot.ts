export interface SessionMeta {
  date: string;
  place: string;
}

export interface Shot {
  club: string;
  index: number;
  ballSpeed: number;
  launchDirection: number;
  launchAngle: number;
  spinRate: number;
  spinAxis: number;
  backSpin: number;
  sideSpin: number;
  apex: number;
  carry: number;
  total: number;
  offline: number;
  landingAngle: number;
  clubPath: number;
  faceAngle: number;
  attackAngle: number;
  dynamicLoft: number;
  impactHorizontal: number;
  impactVertical: number;
  clubSpeed: number;
  smashFactor: number;
}

export interface ClubStats {
  club: string;
  count: number;
  avgCarry: number;
  avgTotal: number;
  avgBallSpeed: number;
  avgClubSpeed: number;
  avgSmash: number;
  medianSmash: number;
  avgSpinRate: number;
  avgOffline: number;
  stdDevCarry: number;
  stdDevOffline: number;
}

export interface SessionAnalysis {
  meta: SessionMeta;
  shots: Shot[];
  clubStats: ClubStats[];
  modelShot: Shot;
  poorContactShots: Set<number>;
  // Set of array indices (into shots[]) that are IQR outliers per club
  outlierIndices: Set<number>;
}
