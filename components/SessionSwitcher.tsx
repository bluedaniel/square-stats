"use client";

import { useRef, useState, useEffect } from "react";
import { useSession } from "@/contexts/SessionContext";
import { useLoadSession } from "@/hooks/useLoadSession";
import { LayoutGrid, ChevronDown, X, Plus } from "lucide-react";

export function SessionSwitcher() {
  const { sessions, activeId, setActiveId, removeSession } = useSession();
  const { loadFile } = useLoadSession();
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const active = sessions.find(s => s.id === activeId);

  useEffect(() => {
    function onClickOutside(e: MouseEvent) {
      if (!containerRef.current?.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  function handleFiles(files: FileList | null) {
    if (!files) return;
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = e => {
        try { loadFile(e.target?.result as string, file.name); }
        catch { /* ignore bad files */ }
      };
      reader.readAsText(file);
    });
    setOpen(false);
  }

  if (!sessions.length) return (
    <div>
      <button
        onClick={() => inputRef.current?.click()}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-border bg-muted/40 hover:bg-muted transition-colors"
      >
        <Plus size={11} className="shrink-0 text-muted-foreground" />
        Load session
      </button>
      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs border border-border bg-muted/40 hover:bg-muted transition-colors max-w-[180px]"
      >
        <LayoutGrid size={11} className="shrink-0 text-muted-foreground" />
        <span className="truncate font-medium">
          {active ? active.filename.replace(/\.csv$/i, "") : "Sessions"}
        </span>
        {sessions.length > 1 && (
          <span className="shrink-0 text-muted-foreground tabular-nums">
            {sessions.indexOf(active!) + 1}/{sessions.length}
          </span>
        )}
        <ChevronDown size={10} className="shrink-0 text-muted-foreground" />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-64 bg-popover border border-border rounded-lg shadow-lg z-50 overflow-hidden">
          <div className="p-1">
            {sessions.map(s => (
              <div
                key={s.id}
                onClick={() => { setActiveId(s.id); setOpen(false); }}
                className={[
                  "flex items-center gap-2 px-2.5 py-2 rounded-md cursor-pointer group transition-colors",
                  s.id === activeId ? "bg-muted" : "hover:bg-muted/60",
                ].join(" ")}
              >
                <span className={[
                  "w-1.5 h-1.5 rounded-full shrink-0 transition-colors",
                  s.id === activeId ? "bg-primary" : "bg-muted-foreground/30",
                ].join(" ")} />
                <span className="flex-1 text-sm truncate">
                  {s.filename.replace(/\.csv$/i, "")}
                </span>
                <button
                  onClick={e => { e.stopPropagation(); removeSession(s.id); }}
                  className="shrink-0 p-0.5 rounded opacity-0 group-hover:opacity-100 hover:bg-destructive/20 hover:text-destructive transition-all"
                  aria-label="Remove"
                >
                  <X size={11} />
                </button>
              </div>
            ))}
          </div>

          <div className="border-t border-border p-1">
            <button
              onClick={() => inputRef.current?.click()}
              className="flex items-center gap-2 w-full px-2.5 py-2 rounded-md text-sm text-muted-foreground hover:text-foreground hover:bg-muted/60 transition-colors"
            >
              <Plus size={12} />
              Add session
            </button>
          </div>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".csv"
        multiple
        className="hidden"
        onChange={e => handleFiles(e.target.files)}
      />
    </div>
  );
}
