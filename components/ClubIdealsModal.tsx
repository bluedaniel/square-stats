"use client";

import { useState } from "react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  CLUB_STAT_KEYS, CLUB_STAT_META, getDefaultIdeals,
  type ClubStatKey, type IdealRange, type BagClub, type Handicap,
} from "@/lib/profile";

interface Props {
  club: BagClub | null;
  handicap: Handicap | "";
  onClose: (ideals: Partial<Record<ClubStatKey, IdealRange>> | null) => void;
}

function buildPrompt(club: BagClub, handicap: Handicap | ""): string {
  const statLines = CLUB_STAT_KEYS.map(key => {
    const { label, unit } = CLUB_STAT_META[key];
    const u = unit ? ` (${unit})` : "";
    const dir = ["offline", "launchDirection", "spinAxis", "sideSpin", "clubPath", "faceAngle", "impactHorizontal"].includes(key)
      ? " — directional: positive = right/toe, negative = left/heel"
      : "";
    return `  "${key}": { "min": ?, "max": ? }  // ${label}${u}${dir}`;
  }).join("\n");

  return `I'm setting up ideal shot ranges for a ${club.label}${club.makeModel ? ` (${club.makeModel})` : ""} for a golfer with a handicap of ${handicap || "unknown"}.

Please return a JSON object with ideal min/max ranges for each of the following stats. Use null where a bound doesn't apply (e.g. carry has no meaningful maximum, offline has no meaningful minimum for a straight shot — use a small tolerance like -3 to 3 instead).

Return ONLY the JSON, no explanation:

{
${statLines}
}`;
}

function parsePaste(text: string): Partial<Record<ClubStatKey, { min: string; max: string }>> | string {
  const cleaned = text.replace(/```(?:json)?\n?/g, "").trim();
  let parsed: unknown;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    return "Could not parse JSON. Make sure you pasted the raw response.";
  }
  if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
    return "Expected a JSON object at the top level.";
  }
  const result: Partial<Record<ClubStatKey, { min: string; max: string }>> = {};
  for (const key of CLUB_STAT_KEYS) {
    const val = (parsed as Record<string, unknown>)[key];
    if (val && typeof val === "object" && !Array.isArray(val)) {
      const v = val as Record<string, unknown>;
      const min = v.min != null && v.min !== "null" ? String(v.min) : "";
      const max = v.max != null && v.max !== "null" ? String(v.max) : "";
      result[key] = { min, max };
    }
  }
  return result;
}

export function ClubIdealsModal({ club, handicap, onClose }: Props) {
  const [mode, setMode] = useState<"ai" | "manual">("ai");
  const [draft, setDraft] = useState<Partial<Record<ClubStatKey, { min: string; max: string }>>>(() => {
    if (!club) return {};
    const defaults = getDefaultIdeals(club.label, handicap);
    const init: Partial<Record<ClubStatKey, { min: string; max: string }>> = {};
    for (const key of CLUB_STAT_KEYS) {
      const r = club.ideals[key] ?? defaults[key];
      init[key] = { min: r?.min != null ? String(r.min) : "", max: r?.max != null ? String(r.max) : "" };
    }
    return init;
  });

  const [pasteText, setPasteText] = useState("");
  const [parseError, setParseError] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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

  function handleCopy() {
    if (!club) return;
    navigator.clipboard.writeText(buildPrompt(club, handicap));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleApply() {
    const result = parsePaste(pasteText);
    if (typeof result === "string") {
      setParseError(result);
      return;
    }
    setParseError(null);
    setDraft(d => {
      const next = { ...d };
      for (const key of CLUB_STAT_KEYS) {
        if (result[key]) next[key] = result[key]!;
      }
      return next;
    });
    setPasteText("");
    setMode("manual");
  }

  if (!club) return null;

  return (
    <Dialog open={!!club} onOpenChange={o => { if (!o) onClose(null); }}>
      <DialogContent className="max-w-sm max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{club.label} ideals</DialogTitle>
        </DialogHeader>

        {mode === "ai" ? (
          <div className="space-y-4">
            <div className="space-y-1.5">
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">1. Copy this prompt into ChatGPT or Claude</p>
                <Button onClick={handleCopy} variant="outline" size="xs">
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <textarea
                readOnly
                value={buildPrompt(club, handicap)}
                rows={6}
                className="w-full text-xs font-mono bg-muted rounded p-2 resize-none border border-border text-muted-foreground"
              />
            </div>

            <div className="space-y-1.5">
              <p className="text-xs text-muted-foreground">2. Paste the response here</p>
              <textarea
                value={pasteText}
                onChange={e => { setPasteText(e.target.value); setParseError(null); }}
                placeholder="Paste JSON response…"
                rows={6}
                className="w-full text-xs font-mono bg-background rounded p-2 resize-none border border-border"
              />
              {parseError && (
                <p className="text-xs text-destructive">{parseError}</p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <Button onClick={() => setMode("manual")} variant="link" size="sm">
                Enter manually
              </Button>
              <Button onClick={handleApply} disabled={!pasteText.trim()} size="sm">
                Apply
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            <div className="flex justify-end">
              <Button onClick={() => setMode("ai")} variant="link" size="sm">
                Generate with AI
              </Button>
            </div>

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

            <DialogFooter>
              <Button onClick={() => onClose(null)} variant="outline">Cancel</Button>
              <Button onClick={handleSave}>Save</Button>
            </DialogFooter>
          </div>
        )}

        {mode === "ai" && (
          <DialogFooter>
            <Button onClick={() => onClose(null)} variant="outline">Cancel</Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}
