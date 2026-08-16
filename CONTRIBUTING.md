# Contributing to MyMediaBox

MyMediaBox is early-stage software. Small, focused pull requests are easier to review than large rewrites.

## Branches

Open normal contributions against `main`. The `stable` branch is reserved for maintainer-approved public releases.

## Start here

```bash
npm install
npm run check
npm run dev
```

For native SQLite/Tauri work:

```bash
npm run tauri:dev
```

## Good contribution areas

- Windows/Linux/macOS testing
- accessibility and keyboard navigation
- episode/library UX
- search and discovery
- metadata-provider abstractions
- tests for progress and migration rules
- documentation
- Retro 98 / Modern theme cleanup
- shareable custom CSS skins

## Data compatibility

Please do not casually rename or delete:

```text
dev.localtv.tracker
local_tv_tracker.db
local-tv-tracker-v1
```

Database changes must be forward migrations under `src-tauri/migrations/`. Existing watch history is treated as durable user data.

## Pixel assets

Navigation sprites live under `src/assets/nav/`. Keep source pixel art crisp; do not apply smoothing when resizing. The UI provides vector fallbacks, and users can toggle the pixel set under Settings → Appearance.

## Before opening a pull request

```bash
npm run check
npm run build
```

If you changed Rust/Tauri code, also run:

```bash
cargo check --manifest-path src-tauri/Cargo.toml
```
