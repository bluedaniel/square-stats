"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  CLUB_STAT_KEYS, CLUB_STAT_META, getDefaultIdeals,
  type ClubStatKey, type IdealRange, type BagClub, type Handicap,
} from "@/lib/profile";

interface Props {
  club: BagClub | null;
  handicap: Handicap | "";
  onClose: (ideals: Partial<Record<ClubStatKey, IdealRange>> | null) => void;
}

export function ClubIdealsModal({ club, handicap, onClose }: Props) {
  const [draft, setDraft] = useState<Partial<Record<ClubStatKey, { min: string; max: string }>>>(() => {
    if (!club) return {};
    const defaults = getDefaultIdeals(club.label, handicap);
    const init: Partial<Record<ClubStatKey, { min: string; max: string }>> = {};
    for (const key of CLUB_STAT_KEYS) {
      const r = club.ideals[key] ?? defaults[key];
      init[key] = { min: r ? String(r.min) : "", max: r ? String(r.max) : "" };
    }
    return init;
  });

  function setField(key: ClubStatKey, field: "min" | "max", val: string) {
    setDraft(d => ({ ...d, [key]: { ...d[key], [field]: val } }));
  }

  function handleSave() {
    const result: Partial<Record<ClubStatKey, IdealRange>> = {};
    for (const key of CLUB_STAT_KEYS) {
      const min = parseFloat(draft[key]?.min ?? "");
      const max = parseFloat(draft[key]?.max ?? "");
      const hasMin = !isNaN(min), hasMax = !isNaN(max);
      if (hasMin || hasMax) result[key] = { ...(hasMin && { min }), ...(hasMax && { max }) };
    }
    onClose(result);
  }

  if (!club) return null;

  return (
    <Dialog open={!!club} onOpenChange={o => { if (!o) onClose(null); }}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{club.label} ideals</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="grid grid-cols-[1fr_80px_80px] gap-x-2 gap-y-2 items-center">
            <div />
            <p className="text-xs text-muted-foreground text-center">Min</p>
            <p className="text-xs text-muted-foreground text-center">Max</p>

            {CLUB_STAT_KEYS.map(key => {
              const { label, unit } = CLUB_STAT_META[key];
              return (
                <>
                  <label key={`${key}-label`} className="text-sm">
                    {label}{unit ? <span className="text-muted-foreground text-xs ml-1">{unit}</span> : null}
                  </label>
                  <Input
                    key={`${key}-min`}
                    type="number"
                    value={draft[key]?.min ?? ""}
                    onChange={e => setField(key, "min", e.target.value)}
                    className="h-8 text-sm text-center px-2"
                  />
                  <Input
                    key={`${key}-max`}
                    type="number"
                    value={draft[key]?.max ?? ""}
                    onChange={e => setField(key, "max", e.target.value)}
                    className="h-8 text-sm text-center px-2"
                  />
                </>
              );
            })}
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={() => onClose(null)}
            className="px-4 py-1.5 rounded text-sm border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            className="px-4 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:opacity-90"
          >
            Save
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
