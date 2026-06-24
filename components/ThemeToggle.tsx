"use client";

import { useEffect, useState, startTransition } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

function resolveIsDark() {
  const saved = localStorage.getItem("theme");
  return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  // Start false to match server HTML; sync after mount via startTransition
  // to avoid React Compiler's setState-in-effect warning.
  const [dark, setDark] = useState(false);

  useEffect(() => {
    startTransition(() => {
      const isDark = resolveIsDark();
      setDark(isDark);
      document.documentElement.classList.toggle("dark", isDark);
    });
  }, []);

  function toggle() {
    const next = !dark;
    setDark(next);
    document.documentElement.classList.toggle("dark", next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button onClick={toggle} aria-label="Toggle dark mode" variant="ghost" size="icon">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
