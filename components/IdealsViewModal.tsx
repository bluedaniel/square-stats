"use client";

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CLUB_STAT_KEYS, CLUB_STAT_META, type BagClub } from "@/lib/profile";

interface Props {
  club: BagClub | null;
  onClose: () => void;
}

export function IdealsViewModal({ club, onClose }: Props) {
  if (!club) return null;

  const rows = CLUB_STAT_KEYS.map((key) => ({
    key,
    ...CLUB_STAT_META[key],
    range: club.ideals[key],
  })).filter((r) => r.range && (r.range.min != null || r.range.max != null));

  return (
    <Dialog
      open={!!club}
      onOpenChange={(o) => {
        if (!o) onClose();
      }}
    >
      <DialogContent className="max-w-xs top-[10vh] translate-y-0">
        <DialogHeader>
          <DialogTitle>{club.label} ideals</DialogTitle>
        </DialogHeader>

        {rows.length === 0 ? (
          <p className="text-sm text-muted-foreground">No ideals set for this club.</p>
        ) : (
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="text-left text-xs text-muted-foreground font-medium py-1 pr-4">
                  Stat
                </th>
                <th className="text-center text-xs text-muted-foreground font-medium py-1 px-2">
                  Min
                </th>
                <th className="text-center text-xs text-muted-foreground font-medium py-1 px-2">
                  Max
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {rows.map(({ key, label, unit, range }) => (
                <tr key={key}>
                  <td className="py-2 pr-4 text-muted-foreground whitespace-nowrap">
                    {label}
                    {unit && <span className="text-xs ml-1">{unit}</span>}
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums">
                    {range!.min ?? <span className="text-muted-foreground">—</span>}
                  </td>
                  <td className="py-2 px-2 text-center tabular-nums">
                    {range!.max ?? <span className="text-muted-foreground">—</span>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </DialogContent>
    </Dialog>
  );
}
