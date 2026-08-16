import { useEffect, useMemo, useRef, useState } from 'react';
import { MediaCard } from '../components/MediaCard';
import { progressFor } from '../lib/progress';
import type { AppSettings, Favorite, LibraryRecord, MediaItem, MediaRating, MediaType, StoppedShow, WatchedEpisode, WatchedMovie } from '../types';

type SortMode = 'recent' | 'oldest' | 'rating-high' | 'rating-low' | 'title' | 'year-new' | 'year-old';
type CompletionFilter = 'all' | 'finished' | 'in-progress' | 'did-not-finish';

type Props = {
  library: LibraryRecord[];
  watchedEpisodes: WatchedEpisode[];
  watchedMovies: WatchedMovie[];
  favorites: Favorite[];
  ratings: MediaRating[];
  stoppedShows: StoppedShow[];
  settings: AppSettings;
  isShowUpdating: (item: MediaItem) => boolean;
  onToggleFavorite: (item: MediaItem) => void;
  onOpen: (item: MediaItem) => void;
  onRate: (item: MediaItem) => void;
  onMarkUpToDate: (item: MediaItem) => void;
  onOpenStats: () => void;
};

type WatchedRow = {
  record: LibraryRecord;
  watchedAt: string;
  rating?: MediaRating;
  finished: boolean;
  completed: boolean;
  stopped: boolean;
};

function latest(values: string[]): string {
  const sorted = values.sort();
  return sorted.length ? sorted[sorted.length - 1] : '';
}

function prettyDate(value: string) {
  if (!value) return 'Date unknown';
  return new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' }).format(new Date(value));
}

function sortLabel(sort: SortMode) {
  const labels: Record<SortMode, string> = {
    recent: 'Recently watched',
    oldest: 'Oldest watched',
    'rating-high': 'Rating: high to low',
    'rating-low': 'Rating: low to high',
    title: 'Title',
    'year-new': 'Release year: newest',
    'year-old': 'Release year: oldest',
  };
  return labels[sort];
}

function isTerminalShowStatus(status?: string) {
  if (!status) return false;
  const normalized = status.trim().toLowerCase();
  return ['ended', 'canceled', 'cancelled', 'finished', 'complete', 'completed'].includes(normalized);
}

export function WatchedView({
  library,
  watchedEpisodes,
  watchedMovies,
  favorites,
  ratings,
  stoppedShows,
  settings,
  isShowUpdating,
  onToggleFavorite,
  onOpen,
  onRate,
  onMarkUpToDate,
  onOpenStats,
}: Props) {
  const [mediaType, setMediaType] = useState<MediaType>('tv');
  const [sort, setSort] = useState<SortMode>('recent');
  const [unratedOnly, setUnratedOnly] = useState(false);
  const [completion, setCompletion] = useState<CompletionFilter>('all');
  const [filterOpen, setFilterOpen] = useState(false);
  const filterRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function closeOnOutside(event: PointerEvent) {
      if (filterRef.current && !filterRef.current.contains(event.target as Node)) setFilterOpen(false);
    }
    document.addEventListener('pointerdown', closeOnOutside);
    return () => document.removeEventListener('pointerdown', closeOnOutside);
  }, []);

  useEffect(() => {
    if (mediaType === 'movie') setCompletion('all');
  }, [mediaType]);

  const rows = useMemo(() => {
    const ratingsByKey = new Map(ratings.map((entry) => [entry.mediaKey, entry]));
    const movieDates = new Map(watchedMovies.map((entry) => [entry.mediaKey, entry.watchedAt]));
    const stoppedByKey = new Map(stoppedShows.map((entry) => [entry.mediaKey, entry]));
    const episodeDates = new Map<string, string[]>();
    for (const entry of watchedEpisodes) {
      const current = episodeDates.get(entry.mediaKey) ?? [];
      current.push(entry.watchedAt);
      episodeDates.set(entry.mediaKey, current);
    }

    const next: WatchedRow[] = [];
    for (const record of library) {
      if (record.item.mediaType !== mediaType) continue;
      const rating = ratingsByKey.get(record.key);
      const stoppedEntry = mediaType === 'tv' ? stoppedByKey.get(record.key) : undefined;
      const watchedAt = mediaType === 'movie'
        ? movieDates.get(record.key) ?? rating?.ratedAt ?? ''
        : latest([...(episodeDates.get(record.key) ?? []), ...(rating ? [rating.ratedAt] : []), ...(stoppedEntry ? [stoppedEntry.stoppedAt] : [])]);
      if (!watchedAt && !rating && !stoppedEntry) continue;
      if (unratedOnly && rating) continue;

      const progress = mediaType === 'tv' ? progressFor(record, watchedEpisodes, settings) : null;
      const stopped = Boolean(stoppedEntry);
      const finished = mediaType === 'movie' || (!stopped && Boolean(progress && progress.total > 0 && progress.watched === progress.total));
      const completed = mediaType === 'tv' && finished && isTerminalShowStatus(record.item.status);
      if (completion === 'finished' && !finished) continue;
      if (completion === 'in-progress' && (finished || stopped)) continue;
      if (completion === 'did-not-finish' && !stopped) continue;
      next.push({ record, watchedAt, rating, finished, completed, stopped });
    }

    return next.sort((a, b) => {
      if (sort === 'recent') return b.watchedAt.localeCompare(a.watchedAt) || a.record.item.title.localeCompare(b.record.item.title);
      if (sort === 'oldest') return a.watchedAt.localeCompare(b.watchedAt) || a.record.item.title.localeCompare(b.record.item.title);
      if (sort === 'rating-high') return (b.rating?.rating ?? -1) - (a.rating?.rating ?? -1) || b.watchedAt.localeCompare(a.watchedAt);
      if (sort === 'rating-low') return (a.rating?.rating ?? 11) - (b.rating?.rating ?? 11) || b.watchedAt.localeCompare(a.watchedAt);
      if (sort === 'title') return a.record.item.title.localeCompare(b.record.item.title);
      const aYear = Number(a.record.item.releaseDate?.slice(0, 4) ?? 0);
      const bYear = Number(b.record.item.releaseDate?.slice(0, 4) ?? 0);
      return sort === 'year-new' ? bYear - aYear : aYear - bYear;
    });
  }, [library, watchedEpisodes, watchedMovies, ratings, stoppedShows, settings, mediaType, sort, unratedOnly, completion]);

  const favoriteKeys = new Set(favorites.map((entry) => entry.mediaKey));
  const activeFilterCount = Number(unratedOnly) + Number(mediaType === 'tv' && completion !== 'all');
  const watchedShowKeys = new Set(watchedEpisodes.map((entry) => entry.mediaKey));
  const stoppedShowKeys = new Set(stoppedShows.map((entry) => entry.mediaKey));
  const startedShows = library.filter((record) => record.item.mediaType === 'tv' && (watchedShowKeys.has(record.key) || ratings.some((rating) => rating.mediaKey === record.key) || stoppedShowKeys.has(record.key))).length;
  const upToDateShows = library.filter((record) => {
    if (record.item.mediaType !== 'tv') return false;
    const progress = progressFor(record, watchedEpisodes, settings);
    return !stoppedShowKeys.has(record.key) && progress.total > 0 && progress.watched === progress.total;
  }).length;
  const averageRating = ratings.length ? ratings.reduce((sum, entry) => sum + entry.rating, 0) / ratings.length : null;

  return (
    <main className="page watched-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">Everything you've marked watched</p>
          <h1>Watch History</h1>
        </div>
      </div>

      <section className="watch-history-stats-panel" aria-label="Your stats summary">
        <div className="watch-history-stats-heading">
          <div>
            <p className="eyebrow">From your local history</p>
            <h2>Your Stats</h2>
          </div>
          <button className="secondary-action compact-action" onClick={onOpenStats}>Open full stats →</button>
        </div>
        <div className="watch-history-stats-grid">
          <div><strong>{watchedEpisodes.length}</strong><span>Episodes</span></div>
          <div><strong>{watchedMovies.length}</strong><span>Movies</span></div>
          <div><strong>{startedShows}</strong><span>Shows started</span></div>
          <div><strong>{upToDateShows}</strong><span>Up to date / complete</span></div>
          <div><strong>{ratings.length}</strong><span>Rated</span></div>
          <div><strong>{averageRating === null ? '—' : averageRating.toFixed(1)}</strong><span>Avg. rating</span></div>
        </div>
      </section>

      <div className="watched-toolbar">
        <div className="view-switch" aria-label="Watch history media type">
          <button className={mediaType === 'tv' ? 'active' : ''} onClick={() => setMediaType('tv')}>TV</button>
          <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => setMediaType('movie')}>Movies</button>
        </div>

        <div className="watched-filter-wrap" ref={filterRef}>
          <button className={`filter-toggle ${filterOpen ? 'active' : ''}`} onClick={() => setFilterOpen((open) => !open)}>
            <span>☰</span>
            Sort & filter{activeFilterCount ? ` · ${activeFilterCount}` : ''}
          </button>
          {filterOpen && (
            <div className="watched-filter-panel">
              <label className="filter-field">
                <span>Sort by</span>
                <select value={sort} onChange={(event) => setSort(event.target.value as SortMode)}>
                  <option value="recent">Recently watched</option>
                  <option value="oldest">Oldest watched</option>
                  <option value="rating-high">Rating: high to low</option>
                  <option value="rating-low">Rating: low to high</option>
                  <option value="title">Title</option>
                  <option value="year-new">Release year: newest</option>
                  <option value="year-old">Release year: oldest</option>
                </select>
              </label>

              {mediaType === 'tv' && (
                <div className="filter-field">
                  <span>Status</span>
                  <div className="filter-choice-row">
                    <button className={completion === 'all' ? 'active' : ''} onClick={() => setCompletion('all')}>All</button>
                    <button className={completion === 'finished' ? 'active' : ''} onClick={() => setCompletion('finished')}>Up to date / completed</button>
                    <button className={completion === 'in-progress' ? 'active' : ''} onClick={() => setCompletion('in-progress')}>In progress</button>
                    <button className={completion === 'did-not-finish' ? 'active' : ''} onClick={() => setCompletion('did-not-finish')}>Did not finish</button>
                  </div>
                </div>
              )}

              <label className="unrated-toggle panel-toggle">
                <input type="checkbox" checked={unratedOnly} onChange={(event) => setUnratedOnly(event.target.checked)} />
                <span>Unrated only</span>
              </label>

              <div className="filter-summary">
                <span>{sortLabel(sort)}</span>
                <button onClick={() => { setSort('recent'); setUnratedOnly(false); setCompletion('all'); }}>Reset</button>
              </div>
            </div>
          )}
        </div>
      </div>

      {rows.length === 0 ? (
        <div className="empty-state">
          <h2>{unratedOnly ? 'Nothing unrated here' : `No matching ${mediaType === 'tv' ? 'shows' : 'movies'}`}</h2>
          <p>Change the filters or keep watching and titles will appear here automatically.</p>
        </div>
      ) : (
        <div className="watched-grid">
          {rows.map(({ record, watchedAt, rating, finished, completed, stopped }) => (
            <div className="watched-card" key={record.key}>
              <MediaCard
                item={record.item}
                tracked
                favorite={favoriteKeys.has(record.key)}
                showFavorite
                showRating
                rating={rating?.rating}
                showLibraryToggle={false}
                showUpToDateToggle={record.item.mediaType === 'tv' && !stopped}
                upToDate={finished}
                updating={isShowUpdating(record.item)}
                onToggle={() => undefined}
                onMarkUpToDate={() => onMarkUpToDate(record.item)}
                onToggleFavorite={() => onToggleFavorite(record.item)}
                onRate={() => onRate(record.item)}
                onOpen={() => onOpen(record.item)}
              />
              <div className="watched-card-copy">
                <button className="watched-title" onClick={() => onOpen(record.item)}>{record.item.title}</button>
                <div className="watched-meta-line">
                  <span className="watched-date">{stopped ? `Stopped ${prettyDate(watchedAt)}` : prettyDate(watchedAt)}</span>
                  {mediaType === 'tv' && (
                    <span className={`completion-dot ${stopped ? 'did-not-finish' : completed ? 'completed' : finished ? 'up-to-date' : ''}`}>
                      {stopped ? 'Did not finish' : completed ? 'Completed' : finished ? 'Up to date' : 'In progress'}
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </main>
  );
}
