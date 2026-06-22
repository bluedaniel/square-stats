"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import {
  CLUB_KEYS, CLUB_LABELS, STAT_KEYS, STAT_LABELS,
  type IdealsConfig, type ClubKey, type StatKey, type IdealRange,
  saveIdeals, resetIdeals, DEFAULT_IDEALS,
} from "@/lib/ideals";

interface Props {
  open: boolean;
  onClose: (updated: IdealsConfig | null) => void;
  initial: IdealsConfig;
  currentClub?: string;
}

function normaliseClubKey(club: string): ClubKey | null {
  const c = club.toLowerCase().replace(/\s+/g, "");
  if (c.includes("driver")) return "driver";
  if (c.includes("3wood") || c === "3w") return "3wood";
  if (c.includes("4iron") || c === "4i") return "4iron";
  if (c.includes("7iron") || c === "7i") return "7iron";
  if (c.includes("9iron") || c === "9i") return "9iron";
  if (c.includes("pw") || c.includes("pitching")) return "pw";
  return null;
}

export function IdealsEditor({ open, onClose, initial, currentClub }: Props) {
  const defaultTab: ClubKey = (currentClub ? normaliseClubKey(currentClub) : null) ?? "driver";
  const [club, setClub] = useState<ClubKey>(defaultTab);
  const [draft, setDraft] = useState<IdealsConfig>(() =>
    JSON.parse(JSON.stringify(initial))
  );

  function setRange(key: StatKey, field: keyof IdealRange, raw: string) {
    const val = parseFloat(raw);
    setDraft(prev => ({
      ...prev,
      [club]: {
        ...prev[club],
        [key]: { ...((prev[club]?.[key]) ?? { min: 0, max: 0 }), [field]: isNaN(val) ? 0 : val },
      },
    }));
  }

  function handleSave() {
    saveIdeals(draft);
    onClose(draft);
  }

  function handleReset() {
    const defaults = resetIdeals();
    setDraft(JSON.parse(JSON.stringify(defaults)));
    onClose(defaults);
  }

  const clubData = draft[club] ?? {};

  return (
    <Dialog open={open} onOpenChange={open => { if (!open) onClose(null); }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Ideal Ranges</DialogTitle>
        </DialogHeader>

        {/* Club tabs */}
        <div className="flex gap-1 flex-wrap">
          {CLUB_KEYS.map(k => (
            <button key={k} onClick={() => setClub(k)}
              className={[
                "px-3 py-1 rounded text-xs font-medium transition-colors",
                club === k
                  ? "bg-primary text-primary-foreground"
                  : "bg-muted text-muted-foreground hover:text-foreground",
              ].join(" ")}>
              {CLUB_LABELS[k]}
            </button>
          ))}
        </div>

        {/* Stat rows */}
        <div className="grid grid-cols-[1fr_auto_auto] gap-x-3 gap-y-2 items-center text-sm">
          <span className="text-xs text-muted-foreground uppercase tracking-wide">Stat</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide text-center w-20">Min</span>
          <span className="text-xs text-muted-foreground uppercase tracking-wide text-center w-20">Max</span>

          {STAT_KEYS.map(key => {
            const range = clubData[key];
            return (
              <>
                <span key={`${key}-label`} className="text-sm">{STAT_LABELS[key]}</span>
                <input
                  key={`${key}-min`}
                  type="number"
                  step="any"
                  value={range?.min ?? ""}
                  placeholder="—"
                  onChange={e => setRange(key, "min", e.target.value)}
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-sm text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                />
                <input
                  key={`${key}-max`}
                  type="number"
                  step="any"
                  value={range?.max ?? ""}
                  placeholder="—"
                  onChange={e => setRange(key, "max", e.target.value)}
                  className="w-20 rounded border border-input bg-background px-2 py-1 text-sm text-center tabular-nums focus:outline-none focus:ring-1 focus:ring-ring"
                />
              </>
            );
          })}
        </div>

        <DialogFooter className="gap-2">
          <button onClick={handleReset}
            className="text-xs text-muted-foreground hover:text-foreground underline">
            Reset to defaults
          </button>
          <button onClick={() => onClose(null)}
            className="px-4 py-1.5 rounded text-sm border border-border hover:bg-muted">
            Cancel
          </button>
          <button onClick={handleSave}
            className="px-4 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:opacity-90">
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
