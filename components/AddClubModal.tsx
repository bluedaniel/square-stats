"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import type { BagClub } from "@/lib/profile";

const CLUB_TYPES = ["Driver", "Wood", "Hybrid", "Iron", "Wedge", "Putter"] as const;
type ClubType = typeof CLUB_TYPES[number];

const SUB_OPTIONS: Record<ClubType, string[]> = {
  Driver: ["Driver", "Mini Driver"],
  Wood:   ["3 Wood", "5 Wood", "7 Wood", "9 Wood"],
  Hybrid: ["2 Hybrid", "3 Hybrid", "4 Hybrid", "5 Hybrid", "6 Hybrid"],
  Iron:   ["2 Iron", "3 Iron", "4 Iron", "5 Iron", "6 Iron", "7 Iron", "8 Iron", "9 Iron"],
  Wedge:  ["Pitching Wedge", "Gap Wedge", "Sand Wedge", "Lob Wedge"],
  Putter: ["Putter"],
};

function detectFromLabel(label: string): { type: ClubType; sub: string } | null {
  for (const type of CLUB_TYPES) {
    const sub = SUB_OPTIONS[type].find(
      s => s.toLowerCase().replace(/\s+/g, "") === label.toLowerCase().replace(/\s+/g, "")
    );
    if (sub) return { type, sub };
  }
  return null;
}

interface Props {
  open: boolean;
  initialLabel?: string;
  onClose: (club: Omit<BagClub, "id"> | null) => void;
}

export function AddClubModal({ open, initialLabel, onClose }: Props) {
  const detected = initialLabel ? detectFromLabel(initialLabel) : null;
  const [clubType, setClubType] = useState<ClubType | "">(detected?.type ?? "");
  const [label, setLabel] = useState(detected?.sub ?? "");
  const [makeModel, setMakeModel] = useState("");

  function selectType(type: ClubType) {
    setClubType(type);
    setLabel("");
  }

  function selectSub(name: string) {
    setLabel(name);
  }

  function handleAdd() {
    if (!label.trim()) return;
    onClose({ label: label.trim(), makeModel: makeModel.trim(), targetCarry: null, ideals: {} });
    reset();
  }

  function handleClose() {
    reset();
    onClose(null);
  }

  function reset() {
    setClubType("");
    setLabel("");
    setMakeModel("");
  }

  return (
    <Dialog open={open} onOpenChange={o => { if (!o) handleClose(); }}>
      <DialogContent className="max-w-sm top-[10vh] translate-y-0">
        <DialogHeader>
          <DialogTitle>Add club</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Type grid */}
          <div className="grid grid-cols-3 gap-2">
            {CLUB_TYPES.map(type => (
              <button
                key={type}
                onClick={() => selectType(type)}
                className={[
                  "aspect-square rounded-lg border text-sm font-medium transition-colors flex items-center justify-center",
                  clubType === type
                    ? "bg-primary text-primary-foreground border-primary"
                    : "border-border hover:bg-muted",
                ].join(" ")}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Sub-options */}
          {clubType && (
            <div className="space-y-2">
              <p className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
                {clubType}
              </p>
              <div className="flex flex-wrap gap-2">
                {SUB_OPTIONS[clubType].map(name => (
                  <button
                    key={name}
                    onClick={() => selectSub(name)}
                    className={[
                      "px-3 py-1.5 rounded-md border text-sm transition-colors",
                      label === name
                        ? "bg-primary text-primary-foreground border-primary"
                        : "border-border hover:bg-muted",
                    ].join(" ")}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Make / Model */}
          <div className="space-y-1.5">
            <label className="text-xs text-muted-foreground uppercase tracking-wide font-medium">
              Make / Model
            </label>
            <Input
              value={makeModel}
              onChange={e => setMakeModel(e.target.value)}
              onKeyDown={e => e.key === "Enter" && handleAdd()}
              placeholder="e.g. TaylorMade P790"
            />
          </div>
        </div>

        <DialogFooter>
          <button
            onClick={handleClose}
            className="px-4 py-1.5 rounded text-sm border border-border hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleAdd}
            disabled={!label.trim()}
            className="px-4 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:opacity-90 disabled:opacity-40"
          >
            Add
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
