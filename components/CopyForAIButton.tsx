"use client";

import { Copy } from "lucide-react";
import { toast } from "sonner";

interface Props {
  getText: () => string;
  className?: string;
}

export function CopyForAIButton({ getText, className }: Props) {
  function handleClick() {
    navigator.clipboard.writeText(getText()).then(() => {
      toast.success("Copied to clipboard");
    });
  }

  return (
    <button
      onClick={handleClick}
      className={className ?? "text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"}
    >
      <span className="inline-flex items-center gap-1.5">
        <Copy size={12} />
        Copy for AI
      </span>
    </button>
  );
}
