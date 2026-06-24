"use client";

import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Sun, Moon } from "lucide-react";

function resolveIsDark() {
  if (typeof window === "undefined") return false;
  const saved = localStorage.getItem("theme");
  return saved ? saved === "dark" : window.matchMedia("(prefers-color-scheme: dark)").matches;
}

export function ThemeToggle() {
  const [dark, setDark] = useState(resolveIsDark);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", dark);
  }, [dark]);

  function toggle() {
    const next = !dark;
    setDark(next);
    localStorage.setItem("theme", next ? "dark" : "light");
  }

  return (
    <Button onClick={toggle} aria-label="Toggle dark mode" variant="ghost" size="icon">
      {dark ? <Sun size={18} /> : <Moon size={18} />}
    </Button>
  );
}
