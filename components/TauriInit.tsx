"use client";

import { useEffect } from "react";
import { syncProfileFromTauri } from "@/lib/profile";

export function TauriInit() {
  useEffect(() => {
    syncProfileFromTauri();
  }, []);
  return null;
}
