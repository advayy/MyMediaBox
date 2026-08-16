<p align="center">
  <img src="src/assets/branding/mymediabox-logo-64.png" width="64" height="64" alt="MyMediaBox pixel-art logo">
</p>

# MyMediaBox

MyMediaBox is a local-first TV and movie tracker built around fast episode checking, simple watchlists, and data that stays on your own computer.

The app uses TMDB for metadata such as titles, episodes, artwork, discovery, recommendations, release dates, certifications, and streaming availability. Your library, watch history, ratings, favorites, stopped-watching state, settings, and backups are local.

> **Status:** 1.0 public release. The core tracker is usable now and development is continuing in public.

## Why I built it

One of my favourite apps was TV Time. When it stopped being usable for me, the parts I missed most were the simple, fast interactions: adding something to a watchlist in one gesture and marking episodes watched just as quickly. I tried other trackers, but I could not find one that matched that workflow closely enough.

I also like the idea of owning my own watch data. If you watch things across several streaming services, cancel a subscription, or a title moves to another platform, your history should not disappear with that service. MyMediaBox keeps the tracking state locally and uses online services only for replaceable media metadata.

## Getting started

MyMediaBox currently uses **TMDB** for its live movie and TV catalogue. To use the real catalogue instead of the bundled demo data:

1. Create a TMDB account and obtain an **API Read Access Token**.
2. Open **Settings → Metadata** in MyMediaBox.
3. Paste the token into **Read Access Token** and save.
4. Discover and Search will show `Metadata database: TMDB live`.

The token stays local and is excluded from portable JSON backups.

### Poster controls

The small controls on posters intentionally use consistent shapes:

- **Square `+ / −`** — add or remove a title from your local watchlist/library.
- **Circle `eye / ✓`** — mark a movie watched or mark a TV show caught up to all currently aired episodes. Using it on an untracked title adds the title automatically.
- **Heart `♥`** — favorite a title.
- **Star `★`** — give a personal 0–10 rating.

## What it does

- one-click TV/movie watchlists
- episode and season checkboxes
- mark an episode plus everything before it
- mark a show up to date in one action
- Currently Watching, Stale, Not Started, Up to Date, Completed, and Did Not Finish states
- movie watched state
- 0–10 personal ratings and favorites
- Watch History and local stats
- upcoming TV episodes and movie releases
- TMDB discovery, search, filters, recommendations, artwork, certifications, and streaming-provider data
- safe search on by default
- SQLite persistence in the desktop app
- automatic local backups plus JSON export/restore
- Retro 98 and Modern skins, editable colors, custom CSS overlays, and optional pixel-art toolbar icons

## Pixel art

The bundled logo and navigation icons are hand-authored pixel art. **Pixel navigation icons are enabled by default** and can be turned off under **Settings → Appearance** to use the vector fallback set.

Source assets live in:

```text
src/assets/branding/
src/assets/nav/
```

The 64×64 logo is also the source of the committed desktop application icons under `src-tauri/icons/`.

## Run it

### Browser UI mode

```bash
npm install
npm run dev
```

This uses browser `localStorage` and is mainly useful for frontend work.

### Native desktop mode

Install the Tauri prerequisites for your operating system, then:

```bash
npm install
npm run tauri:dev
```

Native mode uses SQLite and is the recommended way to use real watch history.

## Build an installable app

```bash
npm run tauri:build
```

Platform bundles are written below:

```text
src-tauri/target/release/bundle/
```

See **[BUILDING.md](BUILDING.md)** for macOS, Windows, Linux, GitHub Actions, release artifacts, and signing notes.

## Local data and upgrades

The rebrand from IMissTVTime to MyMediaBox does **not** move or recreate your existing data. For compatibility, the app still uses the legacy internal storage identity:

```text
Tauri identifier: dev.localtv.tracker
SQLite database:  local_tv_tracker.db
Browser key:      local-tv-tracker-v1
```

On macOS the native database is therefore under:

```text
~/Library/Application Support/dev.localtv.tracker/
```

Normal app updates replace the application, not this data directory. Existing IMissTVTime JSON backups remain importable.

### Completely uninstall on macOS

1. Delete `MyMediaBox.app` from Applications.
2. If you also want to permanently erase the local history and backups, delete:

```text
~/Library/Application Support/dev.localtv.tracker/
```

Do not remove that directory during a normal upgrade.

## Contributing

See **[CONTRIBUTING.md](CONTRIBUTING.md)**. Issues, UX feedback, platform testing, metadata-provider work, accessibility fixes, and community skins are all useful contributions.

## License

MIT

## Downloads and releases

The source of truth for development is `main`. Code approved for a public release is merged into `stable`; GitHub Actions then builds MyMediaBox for macOS, Windows, and Linux and publishes the downloadable files under GitHub Releases. See [`RELEASING.md`](./RELEASING.md) for the maintainer workflow.

The first public version is **1.0.0**. Current builds are unsigned, so macOS or Windows may show a security warning until signing/notarization is configured.

