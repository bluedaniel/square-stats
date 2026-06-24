"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CLUB_STAT_KEYS,
  CLUB_STAT_META,
  getDefaultIdeals,
  HANDICAP_OPTIONS,
  type Handicap,
} from "@/lib/profile";

const REFERENCE_CLUBS: { label: string; sample: string }[] = [
  { label: "Driver", sample: "Driver" },
  { label: "Wood", sample: "3 Wood" },
  { label: "Hybrid", sample: "3 Hybrid" },
  { label: "Long iron", sample: "4 Iron" },
  { label: "Mid iron", sample: "6 Iron" },
  { label: "Short iron", sample: "7 Iron" },
  { label: "Wedge", sample: "Pitching Wedge" },
];

interface Props {
  open: boolean;
  handicap: Handicap | "";
  onHandicapChange: (h: Handicap) => void;
  onClose: () => void;
}

export function DefaultIdealsModal({ open, handicap, onHandicapChange, onClose }: Props) {
  const defaults = REFERENCE_CLUBS.map((c) => ({
    label: c.label,
    ideals: getDefaultIdeals(c.sample, handicap),
  }));

  return (
    <Dialog
      open={open}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="sm:max-w-5xl w-[90vw] max-h-[90vh] overflow-auto top-[5vh] translate-y-0">
        <DialogHeader>
          <div className="flex items-center gap-4">
            <DialogTitle>Suggested ranges</DialogTitle>
            <Select
              value={handicap || undefined}
              onValueChange={(v) => onHandicapChange(v as Handicap)}
            >
              <SelectTrigger className="w-36 h-7 text-xs">
                <SelectValue placeholder="Handicap…" />
              </SelectTrigger>
              <SelectContent>
                {HANDICAP_OPTIONS.map((h) => (
                  <SelectItem key={h} value={h}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </DialogHeader>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium py-2 pr-4 whitespace-nowrap">
                  Stat
                </th>
                {defaults.map((c) => (
                  <th
                    key={c.label}
                    className="text-center text-xs text-muted-foreground font-medium py-2 px-3 whitespace-nowrap"
                  >
                    {c.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {CLUB_STAT_KEYS.map((key) => {
                const { label, unit } = CLUB_STAT_META[key];
                return (
                  <tr key={key} className="hover:bg-muted/30">
                    <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                      {label}
                      {unit && <span className="text-xs ml-1">{unit}</span>}
                    </td>
                    {defaults.map((c) => {
                      const r = c.ideals[key];
                      return (
                        <td
                          key={c.label}
                          className="py-2 px-3 text-center tabular-nums whitespace-nowrap"
                        >
                          {r ? (
                            r.min != null && r.max != null ? (
                              `${r.min} – ${r.max}`
                            ) : r.min != null ? (
                              `≥ ${r.min}`
                            ) : (
                              `≤ ${r.max}`
                            )
                          ) : (
                            <span className="text-muted-foreground">—</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </DialogContent>
    </Dialog>
  );
}
