"use client";

import { useState } from "react";
import { Copy, Check } from "lucide-react";

interface Props {
  getText: () => string;
  className?: string;
}

export function CopyForAIButton({ getText, className }: Props) {
  const [copied, setCopied] = useState(false);

  function handleClick() {
    navigator.clipboard.writeText(getText()).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    });
  }

  return (
    <button
      onClick={handleClick}
      className={className ?? "text-xs text-muted-foreground hover:text-foreground border border-border rounded px-2 py-1 transition-colors"}
    >
      <span className="inline-flex items-center gap-1.5">
        {copied ? <Check size={12} /> : <Copy size={12} />}
        {copied ? "Copied!" : "Copy for AI"}
      </span>
    </button>
  );
}
