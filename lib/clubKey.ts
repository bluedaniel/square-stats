/**
 * Canonical club image keys. Each maps to a set of face/top/side images.
 * Add a new key here when a new club image set is added to /public/faces.
 */
export type ClubKey = "driver" | "3wood" | "4iron" | "7iron" | "9iron" | "pw";

/**
 * Resolves a raw club name string (from CSV) to the closest available ClubKey.
 *
 * Strategy:
 *  - Drivers / 1W → driver
 *  - 2W–5W, hybrids → 3wood
 *  - 2I–5I → 4iron
 *  - 6I–8I → 7iron
 *  - 9I → 9iron
 *  - PW / GW / AW / SW / LW / any wedge → pw
 *  - Putter / unknown → driver (best we have)
 */
export function resolveClubKey(club: string): ClubKey {
  const c = club.toLowerCase().replace(/\s+/g, "");

  // Driver
  if (c.includes("driver") || c === "1w" || c === "1wood") return "driver";

  // Woods (2–5) and hybrids
  if (/^[2-5]w(ood)?$/.test(c)) return "3wood";
  if (c.includes("wood") || c.includes("hybrid") || c.includes("rescue") || c.includes("utility"))
    return "3wood";

  // Extract leading iron number: "7iron", "7i", "7 iron" → 7
  const ironMatch = c.match(/^(\d+)\s*i(ron)?$/);
  if (ironMatch) {
    const n = parseInt(ironMatch[1], 10);
    if (n <= 5) return "4iron";
    if (n <= 8) return "7iron";
    return "9iron";
  }

  // Wedges
  if (
    c.includes("pw") ||
    c.includes("pitching") ||
    c.includes("gw") ||
    c.includes("gap") ||
    c.includes("aw") ||
    c.includes("approach") ||
    c.includes("sw") ||
    c.includes("sand") ||
    c.includes("lw") ||
    c.includes("lob") ||
    c.includes("wedge")
  )
    return "pw";

  // Generic iron fallback
  if (c.includes("iron")) return "7iron";

  return "driver";
}
