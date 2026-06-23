"use client";

import { useState, Suspense, useEffect } from "react";
import pkg from "@/package.json";
import {
  DndContext, closestCenter, PointerSensor, useSensor, useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext, verticalListSortingStrategy, useSortable, arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { useSearchParams } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { AddClubModal } from "@/components/AddClubModal";
import { ClubIdealsModal } from "@/components/ClubIdealsModal";
import { DefaultIdealsModal } from "@/components/DefaultIdealsModal";
import { loadProfile, saveProfile, csvToLabel, HANDICAP_OPTIONS, type UserProfile, type BagClub, type ClubStatKey, type IdealRange } from "@/lib/profile";
import { ExternalLink } from "@/components/ExternalLink";

function BagList({ bag, onDragEnd, onEdit, onRemove }: {
  bag: BagClub[];
  onDragEnd: (e: DragEndEvent) => void;
  onEdit: (club: BagClub) => void;
  onRemove: (id: string) => void;
}) {
  const sensors = useSensors(useSensor(PointerSensor));
  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={onDragEnd}>
      <SortableContext items={bag.map(c => c.id)} strategy={verticalListSortingStrategy}>
        <div className="rounded-lg border border-border divide-y divide-border">
          {bag.map(club => (
            <SortableClubRow key={club.id} club={club} onEdit={onEdit} onRemove={onRemove} />
          ))}
        </div>
      </SortableContext>
    </DndContext>
  );
}

function SortableClubRow({ club, onEdit, onRemove }: {
  club: BagClub;
  onEdit: (club: BagClub) => void;
  onRemove: (id: string) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: club.id });
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Transform.toString(transform), transition }}
      className={[
        "flex items-center justify-between px-4 py-3 bg-background",
        isDragging ? "opacity-50 shadow-lg z-10 relative" : "",
      ].join(" ")}
    >
      {/* Drag handle */}
      <button
        {...attributes} {...listeners}
        className="mr-3 text-muted-foreground/40 hover:text-muted-foreground cursor-grab active:cursor-grabbing touch-none"
        aria-label="Drag to reorder"
      >
        <svg width="13" height="13" viewBox="0 0 13 13" fill="currentColor">
          <circle cx="4" cy="2.5" r="1.2"/><circle cx="9" cy="2.5" r="1.2"/>
          <circle cx="4" cy="6.5" r="1.2"/><circle cx="9" cy="6.5" r="1.2"/>
          <circle cx="4" cy="10.5" r="1.2"/><circle cx="9" cy="10.5" r="1.2"/>
        </svg>
      </button>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium">{club.label}</p>
        {club.makeModel && <p className="text-xs text-muted-foreground">{club.makeModel}</p>}
      </div>
      <div className="flex items-center gap-3 ml-4 shrink-0">
        <button onClick={() => onEdit(club)} className="text-muted-foreground hover:text-foreground text-xs" aria-label="Edit ideals">✎</button>
        <button onClick={() => onRemove(club.id)} className="text-muted-foreground hover:text-destructive text-xs" aria-label="Remove club">✕</button>
      </div>
    </div>
  );
}

function ProfilePageInner() {
  const searchParams = useSearchParams();
  const [version, setVersion] = useState<string>(pkg.version);

  useEffect(() => {
    if (typeof window !== "undefined" && "__TAURI_INTERNALS__" in window) {
      import("@tauri-apps/api/app").then(({ getVersion }) =>
        getVersion().then(setVersion).catch(() => {})
      );
    }
  }, []);
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

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;
    setProfile(p => {
      const from = p.bag.findIndex(c => c.id === active.id);
      const to   = p.bag.findIndex(c => c.id === over.id);
      const next = { ...p, bag: arrayMove(p.bag, from, to) };
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

      <div className="flex gap-8 p-6 items-start max-w-5xl mx-auto">
      <main className="flex-1 min-w-0 space-y-8">
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
          <p className="text-xs text-muted-foreground">
            Your handicap sets the ideal ranges used to grade your shots — lower handicaps get tighter windows for carry, spin, and face-to-path.
          </p>
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
            <BagList
              bag={profile.bag}
              onDragEnd={handleDragEnd}
              onEdit={setEditIdealsClub}
              onRemove={removeClub}
            />
          )}
        </section>

      <footer className="pt-4 border-t border-border text-xs text-muted-foreground">
        Square Stats v{version}
      </footer>
      </main>

      {/* Sidebar */}
      <aside className="hidden lg:flex flex-col gap-5 w-72 shrink-0 sticky top-6">
        <div className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold">About Square Stats</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Square Stats is a free, offline desktop app for analysing Square Omni launch monitor data. Drop in a CSV export and get instant shot analysis — no account, no cloud, no cost.
          </p>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Built for golfers who want to understand their data without paying for a subscription.
          </p>
        </div>

        <div className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold">Feature requests & feedback</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            Have an idea or found a bug? Open an issue on GitHub — all feedback is welcome, no matter how small.
          </p>
          <ExternalLink
            href="https://github.com/bluedaniel/square-stats/issues"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 0C5.37 0 0 5.37 0 12c0 5.31 3.435 9.795 8.205 11.385.6.105.825-.255.825-.57 0-.285-.015-1.23-.015-2.235-3.015.555-3.795-.735-4.035-1.41-.135-.345-.72-1.41-1.23-1.695-.42-.225-1.02-.78-.015-.795.945-.015 1.62.87 1.845 1.23 1.08 1.815 2.805 1.305 3.495.99.105-.78.42-1.305.765-1.605-2.67-.3-5.46-1.335-5.46-5.925 0-1.305.465-2.385 1.23-3.225-.12-.3-.54-1.53.12-3.18 0 0 1.005-.315 3.3 1.23.96-.27 1.98-.405 3-.405s2.04.135 3 .405c2.295-1.56 3.3-1.23 3.3-1.23.66 1.65.24 2.88.12 3.18.765.84 1.23 1.905 1.23 3.225 0 4.605-2.805 5.625-5.475 5.925.435.375.81 1.095.81 2.22 0 1.605-.015 2.895-.015 3.3 0 .315.225.69.825.57A12.02 12.02 0 0 0 24 12c0-6.63-5.37-12-12-12z"/>
            </svg>
            Open an issue
          </ExternalLink>
        </div>

        <div className="rounded-xl border border-border p-5 space-y-3">
          <h2 className="text-sm font-semibold">Latest release</h2>
          <p className="text-xs text-muted-foreground leading-relaxed">
            The app checks for updates automatically. You can also download the latest version directly from GitHub.
          </p>
          <ExternalLink
            href="https://github.com/bluedaniel/square-stats/releases"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
          >
            View releases
          </ExternalLink>
        </div>
      </aside>

      </div>

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

export default function ProfilePage() {
  return (
    <Suspense>
      <ProfilePageInner />
    </Suspense>
  );
}
