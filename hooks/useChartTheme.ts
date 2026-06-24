"use client";

import { useState, useEffect, startTransition } from "react";

interface ChartColors {
  mutedForeground: string;
  border: string;
}

const DEFAULTS: ChartColors = { mutedForeground: "oklch(0.556 0 0)", border: "oklch(0.922 0 0)" };

function resolveColors(): ChartColors {
  const style = getComputedStyle(document.documentElement);
  return {
    mutedForeground: style.getPropertyValue("--muted-foreground").trim(),
    border: style.getPropertyValue("--border").trim(),
  };
}

export function useChartTheme(): ChartColors {
  const [colors, setColors] = useState<ChartColors>(DEFAULTS);

  useEffect(() => {
    startTransition(() => setColors(resolveColors()));
    const observer = new MutationObserver(() => setColors(resolveColors()));
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);

  return colors;
}
