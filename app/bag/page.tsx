"use client";

import { useSession } from "@/contexts/SessionContext";
import { NavBar } from "@/components/NavBar";
import type { SessionAnalysis, ClubStats } from "@/types/shot";
import { FairwayView, CLUB_COLORS } from "@/components/FairwayView";

function gapColor(gap: number) {
  if (gap < 8)  return "text-orange-500";
  if (gap > 20) return "text-amber-500";
  return "text-green-500";
}
function gapLabel(gap: number) {
  if (gap < 8)  return "overlap";
  if (gap > 20) return "big gap";
  return "good";
}

export default function BagPage() {
  const { analysis } = useSession();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />
      <main className="p-6 space-y-4">
        <div>
          <h1 className="text-lg font-semibold">Bag Gapping</h1>
          <p className="text-xs text-muted-foreground mt-0.5">
            Average carry distances and gaps across your clubs.
          </p>
        </div>

        {!analysis ? (
          <p className="text-sm text-muted-foreground py-12 text-center border border-dashed border-border rounded-lg max-w-lg">
            Load a session from the home screen to see your bag gapping.
          </p>
        ) : (
          <GappingLayout analysis={analysis} />
        )}
      </main>
    </div>
  );
}

function GappingLayout({ analysis }: { analysis: SessionAnalysis }) {
  const clubs = [...analysis.clubStats]
    .filter(c => c.avgCarry > 0 && c.count >= 2)
    .sort((a, b) => b.avgCarry - a.avgCarry);

  if (!clubs.length) return (
    <p className="text-sm text-muted-foreground text-center py-8">
      Not enough data — need at least 2 shots per club.
    </p>
  );

  const maxCarry = clubs[0].avgCarry;

  return (
    <div className="flex flex-col lg:flex-row gap-8 items-start">
      {/* Club list */}
      <div className="flex-1 min-w-0 w-full space-y-1">
        {clubs.map((club, i) => {
          const prev   = clubs[i - 1];
          const gap    = prev ? Math.round(prev.avgCarry - club.avgCarry) : null;
          const color  = CLUB_COLORS[i % CLUB_COLORS.length];
          const barPct = (club.avgCarry / maxCarry) * 100;

          return (
            <div key={club.club}>
              {gap !== null && (
                <div className={`flex items-center gap-2 text-xs pl-[148px] py-0.5 ${gapColor(gap)}`}>
                  <span className="font-medium">{gap} yd gap</span>
                  <span className="opacity-70">· {gapLabel(gap)}</span>
                </div>
              )}

              <div className="flex items-center gap-3">
                {/* Color dot + club name */}
                <div className="w-36 shrink-0 flex items-center gap-2">
                  <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ background: color }} />
                  <span className="text-sm font-medium truncate">{club.club}</span>
                </div>

                {/* Bar + carry */}
                <div className="flex-1 flex items-center gap-2 min-w-0">
                  <div className="flex-1 bg-muted rounded-full h-2.5 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${barPct}%` }}
                    />
                  </div>
                  <span className="text-sm tabular-nums font-semibold w-14 shrink-0 text-right">
                    {Math.round(club.avgCarry)} yd
                  </span>
                </div>

                {/* Secondary metrics */}
                <div className="hidden sm:flex items-center gap-3 text-xs text-muted-foreground tabular-nums shrink-0 w-44">
                  <span title="Carry std dev">±{club.stdDevCarry.toFixed(1)} yd</span>
                  <span>{club.avgBallSpeed > 0 ? `${club.avgBallSpeed.toFixed(0)} mph` : "—"}</span>
                  <span>{club.avgSpinRate > 0 ? `${Math.round(club.avgSpinRate)} rpm` : "—"}</span>
                  <span className="text-muted-foreground/50">{club.count} shots</span>
                </div>
              </div>
            </div>
          );
        })}

        <div className="flex flex-wrap items-center gap-4 pt-4 text-xs text-muted-foreground border-t border-border">
          <span className="text-green-500">● good gap (8–20 yd)</span>
          <span className="text-amber-500">● big gap (&gt;20 yd)</span>
          <span className="text-orange-500">● overlap (&lt;8 yd)</span>
        </div>
      </div>

      {/* Fairway visualization */}
      <div className="w-full lg:w-96 lg:shrink-0">
        <FairwayView analysis={analysis} clubs={clubs} />
      </div>
    </div>
  );
}

