"use client";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export type HighlightMode = "off" | "positive" | "negative" | "both";
export const HIGHLIGHT_CYCLE: HighlightMode[] = ["off", "positive", "negative", "both"];

interface Props {
  mode: HighlightMode;
  onCycle: () => void;
}

export function HighlightToggle({ mode, onCycle }: Props) {
  return (
    <div className="flex items-center gap-2">
      <span className="text-xs text-muted-foreground">Highlight ideals:</span>
      <Button
        onClick={onCycle}
        size="sm"
        variant="outline"
        className={cn(
          mode === "positive" &&
            "!bg-green-500 !text-white !border-green-500 hover:!bg-green-500/80",
          mode === "negative" && "!bg-red-500 !text-white !border-red-500 hover:!bg-red-500/80",
          mode === "both" &&
            "!bg-primary !text-primary-foreground !border-primary hover:!bg-primary/80"
        )}
      >
        {mode === "off"
          ? "Off"
          : mode === "positive"
            ? "Positive"
            : mode === "negative"
              ? "Negative"
              : "Both"}
      </Button>
    </div>
  );
}
