import Papa from "papaparse";
import { z } from "zod";
import { ShotSchema, SessionMetaSchema, type ParsedSession } from "@/schemas/shot";

// R/positive, L/negative. T=toe/positive, H=heel/negative for ImpactHorizontal.
function parseDirectional(val: string): number {
  if (val === undefined || val === null || val === "") return 0;
  const s = String(val).trim();
  if (!s) return 0;
  const prefix = s[0].toUpperCase();
  const num = parseFloat(s.slice(1));
  if (isNaN(num)) return parseFloat(s) || 0;
  if (prefix === "R" || prefix === "T") return num;
  if (prefix === "L" || prefix === "H") return -num;
  return parseFloat(s) || 0;
}

function parseNum(val: string): number {
  const n = parseFloat(String(val ?? "").trim());
  return isNaN(n) ? 0 : n;
}

export function parseSquareCSV(csvText: string): ParsedSession {
  // Normalize CRLF and bare CR to LF so PapaParse sees consistent line endings
  const normalised = csvText.replace(/\r\n/g, "\n").replace(/\r/g, "\n");
  const result = Papa.parse<string[]>(normalised, { skipEmptyLines: true });
  const rows = result.data as string[][];

  // Find the header row — first row containing both "Club" and "Carry(yd)"
  let headerIdx = -1;
  for (let i = 0; i < rows.length; i++) {
    if (
      rows[i].some((c) => c.trim() === "Club") &&
      rows[i].some((c) => c.trim().includes("Carry"))
    ) {
      headerIdx = i;
      break;
    }
  }
  if (headerIdx === -1) throw new Error("Could not find header row in CSV");

  // Extract metadata from the row before the header
  const rawMeta: Record<string, string> = {};
  if (headerIdx > 0) {
    const metaRow = rows[headerIdx - 1];
    for (let i = 0; i < metaRow.length - 1; i++) {
      const key = metaRow[i].trim().toLowerCase();
      const val = metaRow[i + 1].trim();
      if (key === "dates") rawMeta.date = val;
      if (key === "place") rawMeta.place = val;
    }
  }
  const meta = SessionMetaSchema.parse(rawMeta);

  const headers = rows[headerIdx].map((h) => h.trim());
  const col = (name: string) => headers.indexOf(name);

  const shots: z.infer<typeof ShotSchema>[] = [];
  for (let i = headerIdx + 1; i < rows.length; i++) {
    const row = rows[i];
    const club = String(row[col("Club")] ?? "").trim();
    if (!club || club === "Average" || club === "Deviation") continue;

    shots.push(
      ShotSchema.parse({
        club,
        index: parseNum(row[col("Index")]),
        ballSpeed: parseNum(row[col("Ball Speed(mph)")]),
        launchDirection: parseDirectional(row[col("Launch Direction")]),
        launchAngle: parseNum(row[col("Launch Angle")]),
        spinRate: Math.abs(parseDirectional(row[col("Spin Rate")])),
        spinAxis: parseDirectional(row[col("Spin Axis")]),
        backSpin: Math.abs(parseDirectional(row[col("Back Spin")])),
        sideSpin: parseDirectional(row[col("Side Spin")]),
        apex: parseNum(row[col("Apex(yd)")]),
        carry: parseNum(row[col("Carry(yd)")]),
        total: parseNum(row[col("Total(yd)")]),
        offline: parseDirectional(row[col("Offline(yd)")]),
        landingAngle: parseNum(row[col("Landing Angle")]),
        clubPath: parseDirectional(row[col("Club Path")]),
        faceAngle: parseDirectional(row[col("Face Angle")]),
        attackAngle: parseNum(row[col("Attack Angle")]),
        dynamicLoft: parseNum(row[col("Dynamic Loft")]),
        impactHorizontal: parseDirectional(row[col("ImpactHorizontal")]),
        impactVertical: parseNum(row[col("ImpactVertical")]),
        clubSpeed: parseNum(row[col("ClubSpeed")]) * 2.23694,
        smashFactor: parseNum(row[col("SmashFactor")]),
      })
    );
  }

  return { meta, shots }; // already validated per-item above; types guaranteed by ShotSchema
}
