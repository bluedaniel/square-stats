# Square Stats

A local desktop app for analysing Square Omni launch monitor sessions. Drop in a CSV export and get shot dispersion, distance histograms, spin charts, trend lines, and a per-shot breakdown with club face diagrams — all offline, no account required.

## What it does

- **Session dashboard** — overview of dispersion, carry distribution, ball speed trend, and smash/spin scatter for any club or the full session
- **All shots table** — filterable, sortable shot log with outlier detection and poor-contact flagging
- **Shot detail** — per-shot stats (distance, speed, launch, spin, club data) with face-to-path diagram, loft diagram, and impact location overlay
- **Club ideals** — set ideal ranges per club; stats highlight green/amber/red against your benchmarks
- **Dark mode** — full light/dark theme

## Running it

**Dev (live reload):**
```bash
npm run tauri dev
```

**Build distributable `.app`:**
```bash
npm run tauri build
# → src-tauri/target/release/bundle/macos/
```

Requires [Rust](https://rustup.rs) installed.

## CSV format

Accepts Square Omni exports. Drop the `.csv` file onto the landing screen or use the Load button. The app reads session metadata (date, location) from the header rows and skips `Average`/`Deviation` summary rows automatically.

## Stack

- [Tauri v2](https://tauri.app) — native shell, no Electron
- [Next.js](https://nextjs.org) — static export frontend
- [Recharts](https://recharts.org) — charts
- [shadcn/ui](https://ui.shadcn.com) — UI components
