# Changelog

## 1.0.0

- first public MyMediaBox release
- stable-branch release workflow builds downloadable desktop bundles for macOS, Windows, and Linux
- added release/version consistency checks so stable releases use one version across the frontend, Tauri config, Rust crate, and app UI
- documented the `main` → `stable` public release workflow

## 0.2.0

- renamed the public project and app from IMissTVTime to **MyMediaBox**
- kept the existing Tauri identifier, SQLite filename, and browser storage key so current local libraries continue to load
- added the supplied MyMediaBox pixel logo to the README, boot screen, and native desktop app icon set
- added supplied pixel-art navigation icons for Discover, My Movies, My Shows, Upcoming, Watch History, and Your Stats
- added an Appearance toggle for pixel navigation icons; pixel icons are enabled by default and the previous vector icons remain as a fallback
- new backups/exports use the MyMediaBox name while old IMissTVTime JSON backups remain importable and visible
- added `BUILDING.md`, `CONTRIBUTING.md`, `.nvmrc`, `rust-toolchain.toml`, and a CI workflow
- refreshed the GitHub release workflow for native macOS, Windows, and Linux builds

## 0.1.20

- made each main area a real color context: Discover purple, Movies red, Shows yellow, Upcoming Tiffany blue, Watch History orange, and Stats blue by default
- page headings, selected controls, filters, timelines and other structural accents now follow the current page color instead of falling back to light purple
- movie/show detail pages inherit the Movies/Shows color based on media type; Search inherits Discover
- renamed the alternate `Modern Purple` skin to `Modern` and neutralized its base chrome so configured colors provide the visual identity
- changed the Appearance preview into an interactive skin specimen: switch preview pages and base skins to see their actual component treatment live
- split Stats genre charts into TV (yellow bars), Movies (red bars), and combined liked genres (Stats blue)
- added media-color strips to summary stat cards
- kept watched-progress bars semantic green rather than allowing page accent colors to imply watch state

## 0.1.19

- restyled expanded episode descriptions as sunken Retro 98 information fields with clearer typography
- restyled Discover and Watch History sort/filter controls to match the active Retro 98 skin
- added configurable per-tab colors for Discover, My Movies, My Shows, Upcoming, Watch History, and Your Stats
- added separate configurable colors for Up to date, Completed, Did not finish, rating, and favorite states
- made the default navigation palette purple / red / yellow / Tiffany blue / orange / blue by section
- replaced more hard-coded grey surfaces with colors derived from the selected Retro desktop/window palette
- extended the live Appearance preview to show tab colors, status colors, ratings, favorites, and progress

## 0.1.18

- finished the Retro 98 pass on Upcoming, stats, Watch History metadata, detail information panels, and streaming-provider cards
- added a tabbed Settings layout with a live Appearance editor
- added live-editable accent, desktop grey, window surface, completion, and remaining-progress colors
- kept custom CSS overlays for fully custom catalogue skins
- added an eye glyph to unselected watched/caught-up controls; selected controls remain filled green with a check
- made completion bars higher contrast with a vivid green fill and darker remaining track
- improved Watch History title/date/status styling for the Retro 98 skin
- widened the detail-page information layout and made Where to Watch use more of the available space
- fixed Retro 98 detail text contrast against backdrop artwork

## 0.1.17

- Added a new default **Retro 98** skin using 98.css, with grey surfaces and the existing light-purple accent.
- Kept the previous interface as the **Modern Purple** skin.
- Added Settings → Appearance for built-in skin selection.
- Added optional local custom CSS overlays and a starter skin template under `skins/`.
- Added one-tap watched circles to movie cards in Discover, Search, and quick-search results.
- Changed TV catch-up circles to appear empty until selected; once caught up they fill green with a check.
- Kept quick library add/remove and watched/caught-up controls visually separate.
- Prepared the visual/storage architecture for a future name and logo change without changing the persistent app identifier.

## 0.1.16

- Fixed episode and season watched-state writes in the native Tauri app. The previous bulk-write implementation used `BEGIN` / `COMMIT` across separate pooled SQL-plugin calls, which could cause the action dialog to close without changing local state.
- Bulk episode writes remain batched, but each batch is now a self-contained SQL statement rather than relying on a cross-call transaction.
- Episode bulk-choice dialogs now stay open until the write succeeds. Failed writes display an error instead of silently disappearing.
- Episode and season controls show an updating state while their local write is in progress.

## 0.1.15

- Reworked episode and season watched checkboxes into reliable button controls instead of hidden native inputs inside labels.
- Increased the actual click target to 44×44 px while keeping the visible checkbox compact.
- Added hover, keyboard-focus, pending, partial, and disabled states so watch controls are easier to hit and clearer in the Tauri WebView.
- No database migration; existing local data is unchanged.

## 0.1.14

- Added a local **Stopped Watching** state for TV shows, similar to a did-not-finish shelf. It preserves existing episode history and ratings instead of deleting them.
- Added **Stop watching / Resume watching** to TV show detail pages. Stopping an untracked show adds it to My Shows first.
- Added a **Stopped Watching** section at the bottom of My Shows; stopped cards carry a Did not finish badge that can be clicked to resume.
- Added **Did not finish** to the Watch History TV status filters and status chips.
- Stopped shows are excluded from active progress groups and from positive personalized-recommendation seeds.
- Marking a stopped show **Up to date** automatically resumes it before the background catch-up job runs.
- Added SQLite migration `0004_stopped_shows.sql` and backup snapshot schema v3. Older v1/v2 backups remain importable.

## 0.1.13

- Reworked **Mark up to date** as a visible background catch-up job so an outer-card action does not block navigation while metadata is being refreshed.
- Added batched episode writes for catch-up, season marking, and **This + all previous**. SQLite writes run in transactions and use multi-row chunks instead of one IPC/database call per episode.
- Catch-up now uses cached episode data immediately when available and only refreshes TMDB when episode metadata is missing or older than the catch-up freshness window; newly aired episodes found by that refresh are included before the job finishes.
- Added updating states to show catch-up controls across Discover, Search, My Shows, Watch History, Your Stats, quick search, and the show detail page; repeated clicks are ignored while a job is running.
- Show detail pages now open the most recent regular season by default, including after season metadata finishes loading.
- Added **Safe search**, enabled by default. Search, Discover, filtered discovery, pagination, and personalized recommendation candidates respect the setting.
- Expanded the Discover source indicator to say **Metadata database: TMDB live / Demo catalog** and show an unavailable state when a configured TMDB refresh fails.
- No database migration is required; existing installations receive the new safe-search setting through the settings key/value store, defaulting to enabled.

## 0.1.12

- Renamed the main personal-library destinations to **My Movies**, **My Shows**, and **Watch History**.
- Reordered the right side of the primary navigation so Upcoming is followed by Watch History and Your Stats.
- Added a compact **Your Stats** summary panel inside Watch History while keeping the full stats view available.
- Moved TV show library controls into the same layout as movies: remove-from-library on the lower left, primary catch-up/watch action on the lower right.
- Moved episode watched controls to the far right of each episode row and matched their 26px size to the season watched control.
- Watch History now labels a continuing 100% show **Up to date**, while terminal statuses such as Ended/Canceled display **Completed** with a purple status chip.
- Restyled Settings as a purple header control consistent with the rest of the primary navigation.
- No database migration; existing history, ratings, favorites, backups, and TMDB credentials continue unchanged.

## 0.1.11

- Darkened horizontal and native scrollbars so Discover rails match the app instead of showing a bright system track.
- Added **Mark up to date** for TV shows. It marks every aired episode counted by progress as watched, adds untracked shows to the library, and works from Discover, Search, Shows, and show detail pages.
- Added episode still images to season rows. Clicking an episode image or title expands its local episode description without changing watched state.
- Moved Where to Watch into a compact right-side block in the detail hero beside the title/description area.
- Kept movie watched state and TV up-to-date state separate: movies are watched as a title; TV catch-up writes the underlying aired episode history.
- Corrected the exported app version constant to 0.1.11.

## 0.1.10

- Moved **Where to watch** to the bottom of title pages; on TV pages it now comes after the season/episode list.
- Added a dedicated watched control beside **Rate** on title pages. Movies can toggle watched directly beside the rating action; TV watch history remains episode-based.
- Made Discover rail scrollbars translucent with transparent tracks instead of the bright native scrollbar.
- Expanded **Upcoming** with TV Shows / Movies modes. The TV timeline shows future tracked episodes; the Movies timeline shows saved movies with future release dates.
- Kept all existing storage identifiers and schema unchanged.

## 0.1.9

- Moved **Up to Date** to the bottom of Shows so titles that need attention remain above caught-up shows.
- Kept the release-aware show logic explicit: when a new unwatched episode airs, a previously Up to Date show moves back to Currently Watching and stays active until watched or until the stale threshold passes.
- Added a poster-level rating star to Movies cards. Rated titles show the local score beside the star.
- Added the same poster-level rating star to Watched cards and removed the duplicate rating chip below the poster.
- Fixed global quick-search navigation: opening a title from autocomplete now treats it as part of the search session, so Back returns to the search results instead of Discover/another underlying tab.
- Preserved expanded/filtered Discover state while a detail page is open, so Back returns to the same Discover result grid instead of resetting to the Discover home rows.
- Kept the native `serde_json` dependency fix required for Tauri builds.

## 0.1.8

- Added an **Up to Date** section to Shows.
- Shows with a newly aired unwatched episode are bumped back into Currently Watching; the new release keeps them active until watched or until the stale threshold passes.
- Sorted show sections by the most relevant recent activity.
- Split Movies into **Want to Watch** first and **Watched** below it so unwatched saved movies remain easy to find.
- Replaced the always-visible Watched sort controls with a compact **Sort & filter** popover matching Discover.
- Added TV completion filtering in Watched for finished/caught-up vs in-progress titles, alongside the existing unrated filter.
- Pressing Enter in global search now opens a full mixed TV/movie poster-grid result view.
- Added paginated full search results and a **See all results** action in the quick-search dropdown.
- Clicking outside the global-search dropdown now dismisses it.
- Kept the `serde_json` native-build fix from 0.1.7.

## 0.1.7

- Restored the direct Rust `serde_json` dependency required by Tauri's `generate_context!()` macro so native dev/build compilation can complete.
- Reworked movie-library card actions: the bottom-right control is now a one-tap watched circle instead of the tracked/checkmark control.
- Added a separate bottom-left remove-from-Movies action so watched state and library membership are no longer overloaded onto the same button.
- Removing a movie from Movies still preserves its watched/rating history, consistent with the existing local-data model.

## 0.1.6

- Moved global search back into the top navigation between **Your Stats** and Settings.
- Added a top-level **Watched** view with TV/Movies modes.
- Added Watched sorting by watch date, personal rating, title, and release year.
- Added an **Unrated only** filter for working through old watch history.
- Added local 0–10 title ratings in 0.5-point steps.
- Added a star rating control to movie/show detail pages and Watched cards.
- Rating a movie also marks it watched; rating a show adds it to Watched without fabricating episode history.
- Added an optional post-watch/post-catch-up rating prompt, disabled by default.
- Added SQLite migration `0003_ratings.sql`.
- Updated local backups to snapshot schema v2 so ratings are included; v1 backups still import.
- Updated recommendation seeding to prefer titles rated 7+ before general watch/favorite history.
- Updated Your Stats with rating count/average and rating-weighted liked genres.
- Removed the unused Makefile, prerequisite shell script, and unused direct Rust `serde` dependency. (`serde_json` is required by Tauri at compile time.)
- Reworked README/product notes around the current navigation and local-data behavior.

## 0.1.5

- Moved **Upcoming** out of Shows into its own primary navigation view.
- Simplified Shows to Currently Watching, Haven't Watched for a While, and Not Started.
- Fixed search-result Back behavior when a result was opened from Settings.

## 0.1.4

- Added region-aware streaming availability from TMDB/JustWatch.
- Added title-logo artwork, release year, certifications/content ratings, runtime, score, and status metadata.
- Added personalized recommendation rows.
- Added advanced Discover filters and full paginated row views.
- Added automatic backups, JSON export, and restore.

## 0.1.3

- Added Your Stats, favorites, TV/Movie Discover switching, Upcoming, and backdrop artwork.
- Marking an episode/movie watched or favoriting a title now tracks it automatically.
- Added SQLite migration `0002_favorites.sql`.

## 0.1.2

- Renamed the project to IMissTVTime without changing persistent storage identifiers.
- Updated the dark purple UI and rounded add buttons.
- Documented data persistence and complete uninstall behavior.

## 0.1.1

- Added TMDB/demo source indication.
- Added **Just this episode** / **This + all previous**.
- Removed Docker.
