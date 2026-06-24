"use client";

import { useEffect, useState } from "react";

const isTauri = typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;

export function UpdateChecker() {
  const [update, setUpdate] = useState<{
    version: string;
    install: () => Promise<void>;
  } | null>(null);
  const [installing, setInstalling] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isTauri) return;
    (async () => {
      try {
        const { check } = await import("@tauri-apps/plugin-updater");
        const result = await check();
        if (result) {
          setUpdate({
            version: result.version,
            install: async () => {
              setInstalling(true);
              setError(null);
              try {
                await result.downloadAndInstall();
                const { relaunch } = await import("@tauri-apps/plugin-process");
                await relaunch();
              } catch (e) {
                console.error("[updater]", e);
                setError("Update failed. Please download manually.");
                setInstalling(false);
              }
            },
          });
        }
      } catch (e) {
        console.error("[updater]", e);
      }
    })();
  }, []);

  if (!update) return null;

  return (
    <div className="flex items-center justify-between bg-primary text-primary-foreground px-4 py-1.5 text-sm">
      <span>{error ?? `Version ${update.version} available`}</span>
      <button
        onClick={update.install}
        disabled={installing}
        className="font-medium underline underline-offset-2 disabled:opacity-60"
      >
        {installing ? "Installing…" : "Install & restart"}
      </button>
    </div>
  );
}
