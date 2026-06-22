"use client";

import { useState, useMemo, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { NavBar } from "@/components/NavBar";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableFooter,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  getFilteredRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
  type VisibilityState,
  type ColumnFiltersState,
  type FilterFn,
  type Row,
} from "@tanstack/react-table";
import { Menu } from "@base-ui/react/menu";
import { useSession } from "@/contexts/SessionContext";
import { loadProfile, findBagClub, profileStatStatus, type ClubStatKey } from "@/lib/profile";
import { SessionMeta } from "@/components/SessionMeta";
import { Button } from "@/components/ui/button";
import { HighlightToggle, HIGHLIGHT_CYCLE, type HighlightMode } from "@/components/HighlightToggle";
import type { Shot } from "@/types/shot";

// Augment TanStack meta type
declare module "@tanstack/react-table" {
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  interface ColumnMeta<TData, TValue> {
    statKey?: ClubStatKey;
  }
}

function fmtDir(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "R" : "L"}${Math.abs(n).toFixed(1)}`;
}

function fmtImpact(n: number): string {
  if (n === 0) return "0";
  return `${n > 0 ? "T" : "H"}${Math.abs(n).toFixed(1)}`;
}

function fmt(n: number, d = 1): string {
  return n === 0 ? "0" : n.toFixed(d);
}

// Parses filter expressions: ">250", "<280", "250-280", or bare number meaning >=X
const numericFilter: FilterFn<Shot> = (row: Row<Shot>, columnId: string, filterValue: string) => {
  const value = row.getValue(columnId) as number;
  const v = filterValue.trim();
  if (!v) return true;
  if (v.startsWith(">=")) return value >= parseFloat(v.slice(2));
  if (v.startsWith("<=")) return value <= parseFloat(v.slice(2));
  if (v.startsWith(">"))  return value >  parseFloat(v.slice(1));
  if (v.startsWith("<"))  return value <  parseFloat(v.slice(1));
  if (v.includes("-")) {
    const [lo, hi] = v.split("-").map(parseFloat);
    return value >= lo && value <= hi;
  }
  return value >= parseFloat(v);
};
numericFilter.autoRemove = (val: string) => !val?.trim();

const COLUMNS: ColumnDef<Shot>[] = [
  { accessorKey: "club",            header: "Club",         cell: ({ row }) => row.original.club,                              enableHiding: false, filterFn: "includesString" },
  { accessorKey: "index",           header: "#",            cell: ({ row }) => row.original.index,                             enableHiding: false, enableColumnFilter: false },
  { accessorKey: "carry",           header: "Carry (yd)",   cell: ({ row }) => fmt(row.original.carry),                        meta: { statKey: "carry" },           filterFn: numericFilter },
  { accessorKey: "total",           header: "Total (yd)",   cell: ({ row }) => fmt(row.original.total),                        meta: { statKey: "total" },           filterFn: numericFilter },
  { accessorKey: "offline",         header: "Offline (yd)", cell: ({ row }) => fmtDir(row.original.offline),                   meta: { statKey: "offline" },         filterFn: numericFilter },
  { accessorKey: "ballSpeed",       header: "Ball Spd",     cell: ({ row }) => fmt(row.original.ballSpeed),                    meta: { statKey: "ballSpeed" },       filterFn: numericFilter },
  { accessorKey: "clubSpeed",       header: "Club Spd",     cell: ({ row }) => row.original.clubSpeed ? fmt(row.original.clubSpeed) : "—", meta: { statKey: "clubSpeed" }, filterFn: numericFilter },
  { accessorKey: "smashFactor",     header: "Smash",        cell: ({ row }) => row.original.smashFactor ? fmt(row.original.smashFactor, 2) : "—", meta: { statKey: "smashFactor" }, filterFn: numericFilter },
  { accessorKey: "launchAngle",     header: "Launch°",      cell: ({ row }) => fmt(row.original.launchAngle),                  meta: { statKey: "launchAngle" },     filterFn: numericFilter },
  { accessorKey: "launchDirection", header: "Launch Dir",   cell: ({ row }) => fmtDir(row.original.launchDirection),           meta: { statKey: "launchDirection" }, filterFn: numericFilter },
  { accessorKey: "spinRate",        header: "Spin (rpm)",   cell: ({ row }) => row.original.spinRate ? fmt(row.original.spinRate, 0) : "—", meta: { statKey: "spinRate" }, filterFn: numericFilter },
  { accessorKey: "spinAxis",        header: "Spin Axis",    cell: ({ row }) => fmtDir(row.original.spinAxis),                  meta: { statKey: "spinAxis" },        filterFn: numericFilter },
  { accessorKey: "backSpin",        header: "Back Spin",    cell: ({ row }) => fmt(row.original.backSpin, 0),                  meta: { statKey: "backSpin" },        filterFn: numericFilter },
  { accessorKey: "sideSpin",        header: "Side Spin",    cell: ({ row }) => fmtDir(row.original.sideSpin),                  meta: { statKey: "sideSpin" },        filterFn: numericFilter },
  { accessorKey: "apex",            header: "Apex (yd)",    cell: ({ row }) => fmt(row.original.apex),                         meta: { statKey: "apex" },            filterFn: numericFilter },
  { accessorKey: "landingAngle",    header: "Land°",        cell: ({ row }) => fmt(row.original.landingAngle),                 meta: { statKey: "landingAngle" },    filterFn: numericFilter },
  { accessorKey: "clubPath",        header: "Club Path",    cell: ({ row }) => fmtDir(row.original.clubPath),                  meta: { statKey: "clubPath" },        filterFn: numericFilter },
  { accessorKey: "faceAngle",       header: "Face Angle",   cell: ({ row }) => fmtDir(row.original.faceAngle),                 meta: { statKey: "faceAngle" },       filterFn: numericFilter },
  { accessorKey: "attackAngle",     header: "Attack°",      cell: ({ row }) => fmt(row.original.attackAngle),                  meta: { statKey: "attackAngle" },     filterFn: numericFilter },
  { accessorKey: "dynamicLoft",     header: "Dyn Loft",     cell: ({ row }) => fmt(row.original.dynamicLoft),                  meta: { statKey: "dynamicLoft" },     filterFn: numericFilter },
  { accessorKey: "impactHorizontal",header: "Impact H",     cell: ({ row }) => fmtImpact(row.original.impactHorizontal),       meta: { statKey: "impactHorizontal" },filterFn: numericFilter },
  { accessorKey: "impactVertical",  header: "Impact V",     cell: ({ row }) => fmt(row.original.impactVertical),               meta: { statKey: "impactVertical" },  filterFn: numericFilter },
];

const FOOTER_FMT: Partial<Record<string, (n: number) => string>> = {
  carry:            n => fmt(n, 1),
  total:            n => fmt(n, 1),
  apex:             n => fmt(n, 1),
  offline:          n => fmtDir(n),
  ballSpeed:        n => fmt(n, 1),
  clubSpeed:        n => fmt(n, 1),
  smashFactor:      n => fmt(n, 2),
  launchAngle:      n => fmt(n, 1),
  launchDirection:  n => fmtDir(n),
  spinRate:         n => fmt(n, 0),
  spinAxis:         n => fmtDir(n),
  backSpin:         n => fmt(n, 0),
  sideSpin:         n => fmtDir(n),
  landingAngle:     n => fmt(n, 1),
  clubPath:         n => fmtDir(n),
  faceAngle:        n => fmtDir(n),
  attackAngle:      n => fmt(n, 1),
  dynamicLoft:      n => fmt(n, 1),
  impactHorizontal: n => fmtImpact(n),
  impactVertical:   n => fmt(n, 1),
};

const DEFAULT_HIDDEN: VisibilityState = {
  launchDirection: false,
  spinAxis: false,
  backSpin: false,
  sideSpin: false,
  apex: false,
  dynamicLoft: false,
  impactHorizontal: false,
  impactVertical: false,
};

function loadVisibility(): VisibilityState {
  try {
    const stored = localStorage.getItem("shotsColumnVisibility");
    return stored ? JSON.parse(stored) : DEFAULT_HIDDEN;
  } catch {
    return DEFAULT_HIDDEN;
  }
}

export default function ShotsPage() {
  const { analysis, filename, setSelectedShot } = useSession();
  const router = useRouter();

  const [selectedClub, setSelectedClub] = useState("All");
  const [hideOutliers, setHideOutliers] = useState(() =>
    typeof window !== "undefined" && localStorage.getItem("hideOutliers") === "true"
  );
  const [highlightMode, setHighlightMode] = useState<HighlightMode>(() =>
    (typeof window !== "undefined" ? localStorage.getItem("highlightMode") as HighlightMode : null) ?? "off"
  );
  const [sorting, setSorting] = useState<SortingState>([{ id: "club", desc: false }]);
  const [columnVisibility, setColumnVisibility] = useState<VisibilityState>(() =>
    typeof window !== "undefined" ? loadVisibility() : DEFAULT_HIDDEN
  );
  const [columnFilters, setColumnFilters] = useState<ColumnFiltersState>([]);
  const [showFilters, setShowFilters] = useState(false);
  const [profile] = useState(() => loadProfile());
  const [llmOpen, setLlmOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    localStorage.setItem("hideOutliers", String(hideOutliers));
  }, [hideOutliers]);

  useEffect(() => {
    localStorage.setItem("shotsColumnVisibility", JSON.stringify(columnVisibility));
  }, [columnVisibility]);

  function cycleHighlight() {
    const next = HIGHLIGHT_CYCLE[(HIGHLIGHT_CYCLE.indexOf(highlightMode) + 1) % HIGHLIGHT_CYCLE.length];
    setHighlightMode(next);
    localStorage.setItem("highlightMode", next);
  }

  const clubs = analysis
    ? ["All", ...new Set(analysis.shots.map(s => s.club))]
    : ["All"];

  const filteredShots = useMemo(() => {
    if (!analysis) return [];
    let shots = hideOutliers
      ? analysis.shots.filter((_, i) => !analysis.outlierIndices.has(i))
      : analysis.shots;
    if (selectedClub !== "All") shots = shots.filter(s => s.club === selectedClub);
    return shots;
  }, [analysis, selectedClub, hideOutliers]);

  const table = useReactTable({
    data: filteredShots,
    columns: COLUMNS,
    state: { sorting, columnVisibility, columnFilters },
    onSortingChange: setSorting,
    onColumnVisibilityChange: setColumnVisibility,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
  });

  if (!analysis) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center space-y-3">
          <p className="text-muted-foreground">No session loaded.</p>
          <Link href="/" className="text-sm underline">Load a CSV</Link>
        </div>
      </div>
    );
  }

  const outlierCount = analysis.outlierIndices.size;
  const rowCount = table.getRowModel().rows.length;

  function colAvg(colId: string, skipZero = false): number | null {
    const vals = table.getRowModel().rows
      .map(r => r.getValue(colId) as number)
      .filter(v => v != null && !isNaN(v) && (!skipZero || v !== 0));
    if (!vals.length) return null;
    return vals.reduce((a, b) => a + b, 0) / vals.length;
  }

  function buildMarkdown(): string {
    const visibleCols = table.getVisibleLeafColumns();
    const headers = visibleCols.map(col => col.columnDef.header as string);
    const sep = headers.map(() => "---");
    const dataRows = table.getRowModel().rows.map(row =>
      row.getVisibleCells().map(cell => {
        const fn = cell.column.columnDef.cell;
        const val = typeof fn === "function" ? fn(cell.getContext()) : cell.getValue();
        return String(val ?? "");
      })
    );
    const toRow = (cells: string[]) => `| ${cells.join(" | ")} |`;
    const meta = [
      analysis!.meta.date && `Date: ${analysis!.meta.date}`,
      analysis!.meta.place && `Place: ${analysis!.meta.place}`,
      filename && `File: ${filename}`,
      selectedClub !== "All" && `Club filter: ${selectedClub}`,
    ].filter(Boolean).join(" · ");
    return [
      meta,
      "",
      toRow(headers),
      toRow(sep),
      ...dataRows.map(toRow),
    ].join("\n");
  }

  function handleCopy() {
    navigator.clipboard.writeText(buildMarkdown());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  const highlightButton = profile.bag.length > 0
    ? <HighlightToggle mode={highlightMode} onCycle={cycleHighlight} />
    : null;

  return (
    <div className="min-h-screen bg-background text-foreground">
      <NavBar />

      <div className="border-b px-6 py-2">
        <SessionMeta
          meta={analysis.meta}
          filename={filename}
          suffix={`${rowCount} shot${rowCount !== 1 ? "s" : ""}`}
          outlierCount={outlierCount}
          hideOutliers={hideOutliers}
          onToggleOutliers={setHideOutliers}
        />
      </div>

      <main className="p-6 space-y-3">
        <div className="flex items-center bg-muted rounded-lg p-0.5 gap-0.5 overflow-x-auto w-fit mx-auto">
          {clubs.map(club => (
            <button
              key={club}
              onClick={() => setSelectedClub(club)}
              className={[
                "px-2.5 py-1 text-xs rounded-md whitespace-nowrap transition-colors select-none",
                club === selectedClub
                  ? "bg-background shadow-sm text-foreground font-medium"
                  : "text-muted-foreground hover:text-foreground",
              ].join(" ")}
            >
              {club}
            </button>
          ))}
        </div>

        <div className="flex items-center justify-between gap-2">
          <div>{highlightButton}</div>
          <div className="flex items-center gap-2">
          <Button onClick={() => setLlmOpen(true)} variant="outline" size="sm">
            Copy for AI
          </Button>
          <Button
            onClick={() => {
              setShowFilters(v => !v);
              if (showFilters) setColumnFilters([]);
            }}
            variant={showFilters ? "default" : "outline"}
            size="sm"
          >
            Filter{columnFilters.length > 0 ? ` (${columnFilters.length})` : ""}
          </Button>
          <Menu.Root>
            <Menu.Trigger className="px-2.5 py-1 rounded border border-border text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
              Show/Hide Columns
            </Menu.Trigger>
            <Menu.Portal>
              <Menu.Positioner align="end" sideOffset={6} className="z-50">
                <Menu.Popup className="min-w-44 max-h-80 overflow-y-auto rounded-lg bg-popover text-popover-foreground shadow-md ring-1 ring-foreground/10 p-1 data-open:animate-in data-open:fade-in-0 data-open:zoom-in-95 data-closed:animate-out data-closed:fade-out-0 data-closed:zoom-out-95 origin-(--transform-origin)">
                  {table.getAllLeafColumns().filter(col => col.getCanHide()).map(col => (
                    <Menu.CheckboxItem
                      key={col.id}
                      checked={col.getIsVisible()}
                      onCheckedChange={checked => col.toggleVisibility(checked)}
                      closeOnClick={false}
                      className="flex items-center gap-2 rounded-md px-2 py-1.5 text-sm cursor-default select-none outline-none hover:bg-accent hover:text-accent-foreground data-highlighted:bg-accent data-highlighted:text-accent-foreground"
                    >
                      <span className={[
                        "flex size-4 shrink-0 items-center justify-center rounded border text-[10px] leading-none",
                        col.getIsVisible()
                          ? "bg-primary border-primary text-primary-foreground"
                          : "border-input",
                      ].join(" ")}>
                        {col.getIsVisible() && "✓"}
                      </span>
                      {col.columnDef.header as string}
                    </Menu.CheckboxItem>
                  ))}
                </Menu.Popup>
              </Menu.Positioner>
            </Menu.Portal>
          </Menu.Root>
          </div>
        </div>
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map(hg => (
                <TableRow key={hg.id}>
                  {hg.headers.map(header => (
                    <TableHead
                      key={header.id}
                      className="cursor-pointer select-none whitespace-nowrap"
                      onClick={header.column.getToggleSortingHandler()}
                    >
                      {flexRender(header.column.columnDef.header, header.getContext())}
                      {header.column.getIsSorted() === "asc" ? " ↑" : header.column.getIsSorted() === "desc" ? " ↓" : ""}
                    </TableHead>
                  ))}
                </TableRow>
              ))}
              {showFilters && (
                <TableRow className="hover:bg-transparent">
                  {table.getHeaderGroups()[0].headers.map(header => (
                    <TableHead key={header.id} className="py-1 px-2">
                      {header.column.getCanFilter() ? (
                        <input
                          value={(header.column.getFilterValue() as string) ?? ""}
                          onChange={e => header.column.setFilterValue(e.target.value || undefined)}
                          placeholder={header.column.id === "club" ? "Driver…" : ">250"}
                          className="w-full min-w-12 rounded border border-border bg-background px-1.5 py-0.5 text-xs font-normal text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring"
                          onClick={e => e.stopPropagation()}
                        />
                      ) : null}
                    </TableHead>
                  ))}
                </TableRow>
              )}
            </TableHeader>
            <TableBody>
              {table.getRowModel().rows.map(row => {
                const shot = row.original;
                const arrayIdx = analysis.shots.indexOf(shot);
                const isOutlier = analysis.outlierIndices.has(arrayIdx);
                const isPoorContact = analysis.poorContactShots.has(shot.index);
                const bagClub = findBagClub(shot.club, profile.bag);
                return (
                  <TableRow
                    key={row.id}
                    className={`cursor-pointer hover:bg-muted/50 ${
                      isOutlier ? "opacity-40" : isPoorContact ? "text-muted-foreground" : ""
                    }`}
                    onClick={() => { setSelectedShot(shot); router.push("/shot"); }}
                  >
                    {row.getVisibleCells().map(cell => {
                      const statKey = cell.column.columnDef.meta?.statKey;
                      const val = statKey ? (shot[statKey as keyof Shot] as number) : undefined;
                      const status = statKey ? profileStatStatus(bagClub, statKey, val) : undefined;
                      const showGood = status === "good" && (highlightMode === "positive" || highlightMode === "both");
                      const showBad  = status === "bad"  && (highlightMode === "negative" || highlightMode === "both");
                      return (
                        <TableCell
                          key={cell.id}
                          className={[
                            "tabular-nums whitespace-nowrap text-sm",
                            showGood ? "bg-green-500/15 text-green-700 dark:text-green-400" : "",
                            showBad  ? "bg-red-500/15 text-red-700 dark:text-red-400"   : "",
                          ].join(" ")}
                        >
                          {flexRender(cell.column.columnDef.cell, cell.getContext())}
                        </TableCell>
                      );
                    })}
                  </TableRow>
                );
              })}
            </TableBody>
            <TableFooter>
              <TableRow>
                {table.getVisibleLeafColumns().map(col => {
                  if (col.id === "club") return (
                    <TableCell key={col.id} className="text-xs font-medium text-muted-foreground py-2">
                      Avg
                    </TableCell>
                  );
                  if (col.id === "index") return <TableCell key={col.id} />;
                  const skipZero = col.id === "clubSpeed" || col.id === "smashFactor";
                  const avg = colAvg(col.id, skipZero);
                  const formatter = FOOTER_FMT[col.id];
                  return (
                    <TableCell key={col.id} className="tabular-nums whitespace-nowrap text-sm py-2">
                      {avg != null && formatter ? formatter(avg) : ""}
                    </TableCell>
                  );
                })}
              </TableRow>
            </TableFooter>
          </Table>
        </div>
      </main>

      <Dialog open={llmOpen} onOpenChange={o => { if (!o) { setLlmOpen(false); setCopied(false); } }}>
        <DialogContent className="sm:max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Copy for AI</DialogTitle>
          </DialogHeader>
          <p className="text-xs text-muted-foreground">
            Copy this table and paste it into ChatGPT, Claude, or any AI assistant to analyse your shots.
          </p>
          <textarea
            readOnly
            value={llmOpen ? buildMarkdown() : ""}
            className="flex-1 min-h-64 font-mono text-xs bg-muted rounded p-3 resize-none border border-border"
          />
          <div className="flex justify-end pt-2">
            <button
              onClick={handleCopy}
              className="px-4 py-1.5 rounded text-sm bg-primary text-primary-foreground hover:opacity-90"
            >
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
