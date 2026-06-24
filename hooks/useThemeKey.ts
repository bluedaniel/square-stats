"use client";

import { useState, useEffect, startTransition } from "react";

export function useThemeKey() {
  const [isDark, setIsDark] = useState(false);
  useEffect(() => {
    startTransition(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    const observer = new MutationObserver(() => {
      setIsDark(document.documentElement.classList.contains("dark"));
    });
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
    return () => observer.disconnect();
  }, []);
  return isDark ? "dark" : "light";
}
