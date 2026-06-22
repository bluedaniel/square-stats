"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AddClubModal } from "@/components/AddClubModal";
import { ClubIdealsModal } from "@/components/ClubIdealsModal";
import { DefaultIdealsModal } from "@/components/DefaultIdealsModal";
import { loadProfile, saveProfile, csvToLabel, HANDICAP_OPTIONS, type UserProfile, type BagClub, type ClubStatKey, type IdealRange } from "@/lib/profile";

export default function ProfilePage() {
  const searchParams = useSearchParams();
  const addClubParam = searchParams.get("addClub");
  const [profile, setProfile] = useState<UserProfile>(() => loadProfile());
  const [addOpen, setAddOpen] = useState(!!addClubParam);
  const [addInitialLabel] = useState(() => addClubParam ? csvToLabel(addClubParam) : undefined);
  const [editIdealsClub, setEditIdealsClub] = useState<BagClub | null>(null);
  const [defaultsOpen, setDefaultsOpen] = useState(false);

  function updateAndSave(patch: Partial<UserProfile>) {
    setProfile(p => {
      const next = { ...p, ...patch };
      saveProfile(next);
      return next;
    });
  }

  function removeClub(id: string) {
    setProfile(p => {
      const next = { ...p, bag: p.bag.filter(c => c.id !== id) };
      saveProfile(next);
      return next;
    });
  }

  function handleIdealsClose(ideals: Partial<Record<ClubStatKey, IdealRange>> | null) {
    if (ideals && editIdealsClub) {
      setProfile(p => {
        const next = { ...p, bag: p.bag.map(c => c.id === editIdealsClub.id ? { ...c, ideals } : c) };
        saveProfile(next);
        return next;
      });
    }
    setEditIdealsClub(null);
  }

  function handleAddClose(club: Omit<BagClub, "id"> | null) {
    if (club) {
      const newClub: BagClub = { id: Date.now().toString(), ...club };
      setProfile(p => {
        const next = { ...p, bag: [...p.bag, newClub] };
        saveProfile(next);
        return next;
      });
      setEditIdealsClub(newClub);
    }
    setAddOpen(false);
  }

  const hasHandicap = profile.handicap !== "";

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <main className="p-6 max-w-xl mx-auto space-y-8">
        {/* Handicap */}
        <section className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Handicap
          </label>
          <Select
            value={profile.handicap || undefined}
            onValueChange={v => updateAndSave({ handicap: v as typeof profile.handicap })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select…" />
            </SelectTrigger>
            <SelectContent>
              {HANDICAP_OPTIONS.map(h => (
                <SelectItem key={h} value={h}>{h}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </section>

        {/* Name */}
        <section className="space-y-2">
          <label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Your name
          </label>
          <Input
            value={profile.name}
            onChange={e => updateAndSave({ name: e.target.value })}
            placeholder="e.g. Daniel"
          />
        </section>

        {/* Bag */}
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Bag setup {profile.bag.length > 0 && <span className="normal-case font-normal">({profile.bag.length})</span>}
            </p>
            <div className="flex items-center gap-2">
              {hasHandicap && (
                <button
                  onClick={() => setDefaultsOpen(true)}
                  className="text-xs text-muted-foreground hover:text-foreground underline"
                >
                  Suggested ranges
                </button>
              )}
              <button
                onClick={() => hasHandicap && setAddOpen(true)}
                disabled={!hasHandicap}
                title={!hasHandicap ? "Set your handicap first" : undefined}
                className="text-xs px-3 py-1 rounded border border-border hover:bg-muted disabled:opacity-40 disabled:cursor-not-allowed"
              >
                + Add club
              </button>
            </div>
          </div>

          {!hasHandicap && (
            <p className="text-xs text-muted-foreground">Set your handicap above to add clubs.</p>
          )}

          {hasHandicap && profile.bag.length === 0 && (
            <p className="text-sm text-muted-foreground py-6 text-center border border-dashed border-border rounded-lg">
              No clubs added yet.
            </p>
          )}

          {profile.bag.length > 0 && (
            <div className="rounded-lg border border-border divide-y divide-border">
              {profile.bag.map(club => (
                <div key={club.id} className="flex items-center justify-between px-4 py-3">
                  <div>
                    <p className="text-sm font-medium">{club.label}</p>
                    {club.makeModel && (
                      <p className="text-xs text-muted-foreground">{club.makeModel}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-3 ml-4 shrink-0">
                    <button
                      onClick={() => setEditIdealsClub(club)}
                      className="text-muted-foreground hover:text-foreground text-xs"
                      aria-label="Edit ideals"
                    >
                      ✎
                    </button>
                    <button
                      onClick={() => removeClub(club.id)}
                      className="text-muted-foreground hover:text-destructive text-xs"
                      aria-label="Remove club"
                    >
                      ✕
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      </main>

      <DefaultIdealsModal
        open={defaultsOpen}
        handicap={profile.handicap}
        onHandicapChange={h => updateAndSave({ handicap: h })}
        onClose={() => setDefaultsOpen(false)}
      />
      <AddClubModal open={addOpen} initialLabel={addInitialLabel} onClose={handleAddClose} />
      <ClubIdealsModal key={editIdealsClub?.id ?? "none"} club={editIdealsClub} handicap={profile.handicap} onClose={handleIdealsClose} />
    </div>
  );
}
