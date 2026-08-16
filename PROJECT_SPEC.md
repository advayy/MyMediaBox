# MyMediaBox product notes

## What this app is

MyMediaBox is a local-first replacement for the fast tracking parts of TV Time: a poster-heavy library, quick checkboxes, simple discovery, and no account required.

The core split is:

- **Remote metadata:** TMDB titles, images, episode data, release dates, public scores, certifications, streaming availability, and recommendation candidates.
- **Local user data:** library membership, watched state, stopped-watching state, timestamps, favorites, personal ratings, settings, and backups.

The app must remain useful when the network is unavailable.

## UX rules

1. **Keep common actions immediate.** Add/remove, favorite, and watched controls should not require navigation through extra forms.
2. **Keep the header compact.** Primary views, quick search, and Settings belong in one row. Search suggestions are lightweight; pressing Enter can open a full result grid when the user actually wants to browse results.
3. **Do not force ratings.** A rating is useful but optional. The post-watch prompt is opt-in and defaults off.
4. **Do not fake history.** Rating a TV show can establish that the user watched it, but it must not manufacture episode timestamps or mark every episode watched.
5. **Local state renders first.** Metadata refresh should happen after the saved library is usable.
6. **Do not overload state controls.** Watched, favorite, rating, and library membership are separate concepts and should not share the same icon or click target. Title pages keep watched and rating actions together near the title; provider availability stays visually secondary in a compact supporting column beside the title metadata.
7. **Keep secondary browsing chrome quiet.** Horizontal rails should not be dominated by native scrollbars or other high-contrast controls.
8. **Make data easy to leave with.** Backups and documented export formats are part of the product, not a recovery afterthought.

9. **Make personal collections read personally.** Primary library labels use My Shows, My Movies, and Watch History so the difference between discovery and owned local state is obvious. Upcoming comes before history/stats in the primary navigation.
10. **Keep repeated controls spatially consistent.** On library posters, remove-from-library sits on the left and the primary watched/catch-up action sits on the right. Episode watched controls use the same visual size as season watched controls.
11. **Distinguish caught up from completed.** A continuing show at 100% aired progress is Up to date. A terminal show (for example Ended or Canceled) at 100% is Completed, shown with the purple completion treatment.
12. **Long bulk actions must stay navigable.** Mark up to date, whole-season marking, and other multi-episode operations should use batched local writes and visible background progress instead of making the interface wait on one episode at a time.
13. **Default discovery to safer results.** Safe search starts on and is user-configurable. Search, Discover, and recommendation candidates should consistently respect it.
14. **Open detail pages where the user is most likely to continue.** For TV, the newest regular season is the initial expanded season; older seasons remain available below it.

## Main views

### Discover

TV and Movies are separate modes. Rows provide quick browsing; the arrow on a row opens a full paginated grid. The page clearly labels the active metadata source as the bundled demo catalog or live TMDB metadata. Advanced filters can be used with no text query, so a user can ask for things such as “all 1990s science-fiction movies rated at least 7.”

Personalized rows use local history to choose seeds, then ask TMDB for recommendation candidates. Higher local ratings should be better recommendation seeds than low ratings.

Opening a title from an expanded Discover row or filtered Discover result should preserve that Discover state. Back returns to the same result grid rather than rebuilding the Discover home screen.

### Search

Typing in the header shows a small quick-result dropdown. Clicking elsewhere closes it. Pressing Enter (or choosing **See all results**) opens a full mixed TV/movie poster grid, with further result pages available from TMDB. Opening a title from either the quick dropdown or the full result grid and going Back returns to the active search results instead of the underlying main tab.

### My Movies

Tracked movie library. Unwatched titles stay first so the page acts like a practical watchlist; watched movies move into a lower Watched section. A movie card keeps four separate actions visually distinct:

- star at the top-left: personal 0–10 rating
- heart at the top-right: favorite / unfavorite
- circle at the bottom-right: watched / unwatched
- remove action at the bottom-left: remove from My Movies

Opening the poster gives the full detail page. Removing a movie from the library does not delete its watched state or personal rating.

### My Shows

Tracked TV library grouped by current viewing state:

- Currently Watching
- Haven't Watched for a While
- Not Started
- Up to Date

Progress uses aired episodes and excludes specials by default. Up to Date is deliberately the last section: it contains shows that currently need no action. If one of those shows gets a newly aired unwatched episode, that release date counts as fresh activity and the show moves back to Currently Watching. It stays active until watched or until the stale threshold passes.

### Watch History

A history-oriented view separate from the active library grouping.

- TV / Movies switch
- compact **Sort & filter** control rather than permanent form fields
- newest/oldest watched, rating high/low, title, and release year sorting
- TV completion filter for finished/caught-up vs in-progress
- **Unrated only** filter for quickly working through old history
- rating star directly on each poster for quick access to the rating slider

For TV, the watched date is the latest known episode-watch timestamp. A rated show with no episode timestamps may use the rating timestamp so it can still appear in Watch History.

### Upcoming

A dedicated release timeline with **TV Shows / Movies** modes. TV mode lists announced future episodes from tracked shows. Movies mode lists saved movies with future release dates. Upcoming stays separate from Shows so the main library remains focused on current viewing state.

### Your Stats

Derived locally. Current useful stats include episode/movie counts, started/caught-up shows, favorites, rating count/average, most-watched year, most-watched genres, and most-liked genres.

“Most liked” should use personal 0–10 ratings when available rather than treating a public TMDB score as the user's taste.

### Settings

Tracking behavior, rating prompt, TMDB credential/region/language, data safety, uninstall guidance, and credits.

## Ratings

Personal ratings are title-level and range from **0 to 10** in 0.5 steps.

- A star **Rate** control is available on every movie/show detail page.
- Saving a movie rating also marks the movie watched.
- Saving a TV rating tracks the title and makes it eligible for Watch History, but does not alter episode checkboxes.
- Clearing a rating does not clear watch history.
- If enabled in Settings, finishing a movie or reaching 100% of aired regular episodes in a show opens the rating control.
- The prompt is off by default.

Ratings are stored locally and included in backups. Watch History also carries a compact Your Stats summary; the full Your Stats view remains available from the top navigation.

## Episode tracking

Checking an episode writes locally immediately. If earlier aired regular episodes are unchecked, the user can choose:

- **Just this episode**
- **This + all previous**

Checking an episode, a season, or a movie implicitly adds the parent title to the library.

Future episodes are visible but not checkable by default.

## Data compatibility

Stable identifiers:

```text
Tauri identifier:    dev.localtv.tracker
SQLite database:     local_tv_tracker.db
Browser key:         local-tv-tracker-v1
```

Native tables:

- `library_items`
- `watched_episodes`
- `watched_movies`
- `settings`
- `favorites`
- `ratings`

Schema changes use forward migrations. Existing watch data must not be recreated or reset during normal updates.

## Backup format

Current exports use snapshot schema version 3 and contain:

- cached library records
- watched episodes
- watched movies
- favorites
- ratings
- stopped-watching state
- non-secret settings, including skin preferences/custom CSS

Schema versions 1 and 2 remain importable; missing stopped-watching/ratings/newer settings fall back to defaults.

The TMDB token is not written to portable backups. Restoring on an existing machine keeps that machine's current token.

Native automatic backups are attempted once per day on launch and keep the newest 10. Manual restore first creates a safety snapshot.

## Build model

- React + TypeScript + Vite frontend
- Tauri 2 desktop shell
- SQLite via Tauri SQL plugin
- Tauri HTTP for TMDB calls
- Tauri filesystem/dialog plugins for backups
- browser/localStorage mode only as a lightweight development option

Native release bundles are built per target operating system.

## TV catch-up and episode detail

- A TV show can be marked **Up to date** from Discover, Search, My Shows, or the show detail page.
- Marking a show up to date adds it to the library if necessary and records all currently aired episodes included by the progress settings. It must not fabricate future episode history.
- Up-to-date is derived from episode history, not stored as a separate truth value. A newly aired episode therefore automatically makes the show active again.
- Episode rows may show TMDB still images. Opening episode details is separate from changing watched state.
- Provider availability belongs in the detail hero as supporting information, alongside title metadata rather than interrupting the episode list.
- Scroll chrome should visually recede into the dark application shell; system-bright horizontal tracks are treated as a styling bug.


## Stopped watching / did not finish

- A tracked TV show can be marked **Stopped Watching** without deleting any watched episodes, rating, or other history.
- Stopped titles leave Currently Watching, Haven't Watched for a While, Not Started, and Up to Date, and appear in a dedicated **Stopped Watching** section at the bottom of My Shows.
- Watch History can filter TV titles to **Did not finish**. Stopped titles are not treated as active in-progress shows or as up-to-date titles.
- **Resume watching** removes the stopped state and lets the normal progress/activity rules place the show again.
- **Mark up to date** also resumes a stopped show because catching up is an explicit return to active tracking.
- Stopped shows should not be used as positive seeds for personalized recommendations.
- The state is local, backed up, and migrated forward like favorites and ratings.

## Visual system

- `Retro 98` is the default skin and uses 98.css for control primitives over a neutral grey surface. Structural accents follow the current area: Discover, Movies, Shows, Upcoming, Watch History, or Stats.
- `Modern` is a neutral-grey contemporary skin that uses the same configurable page colors and semantic status colors as Retro 98.
- Appearance settings preview live before they are saved; the built-in Retro 98 palette exposes accent, desktop, window-surface, completed, and remaining-progress colors.
- Custom skins are local CSS overlays loaded by the user; they must not affect persistence or tracking behavior.
- Poster actions keep a stable visual language across skins: add/remove is distinct from watched/caught-up state; an unselected watch-state circle uses an eye glyph, while a completed watch-state circle fills green with a check.
- Retro skin components should not leak modern rounded/dark panels: stats, timelines, metadata blocks, and catalogue labels use the same raised/sunken surface language.
- Branding (display name/logo) is separate from storage identity so future renaming does not move or erase user data.


### Skin color roles

Navigation accents are intentionally independent from tracking-state colors. A skin may give Discover, Movies, Shows, Upcoming, Watch History, and Stats distinct colors while keeping watched/caught-up, completed, DNF, rating, and favorite states semantically consistent. These roles are user-configurable in Appearance and can still be overridden by custom CSS.

## Legacy storage identity

The public name is MyMediaBox. Existing installs deliberately keep the storage identifier `dev.localtv.tracker`, the SQLite filename `local_tv_tracker.db`, and the browser key used by earlier IMissTVTime builds. Do not rename them without an explicit migration. Old IMissTVTime JSON backups remain importable.
