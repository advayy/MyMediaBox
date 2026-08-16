import { MediaCard } from '../components/MediaCard';
import { categorizeShows, progressFor } from '../lib/progress';
import type { AppSettings, Favorite, LibraryRecord, MediaItem, StoppedShow, WatchedEpisode } from '../types';

type Props = {
  library: LibraryRecord[];
  watchedEpisodes: WatchedEpisode[];
  favorites: Favorite[];
  stoppedShows: StoppedShow[];
  settings: AppSettings;
  isShowUpdating: (item: MediaItem) => boolean;
  onToggle: (item: MediaItem) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onMarkUpToDate: (item: MediaItem) => void;
  onToggleStopped: (item: MediaItem) => void;
  onOpen: (item: MediaItem) => void;
};

export function ShowsView({
  library,
  watchedEpisodes,
  favorites,
  stoppedShows,
  settings,
  isShowUpdating,
  onToggle,
  onToggleFavorite,
  onMarkUpToDate,
  onToggleStopped,
  onOpen,
}: Props) {
  const stoppedKeys = new Set(stoppedShows.map((entry) => entry.mediaKey));
  const stoppedAtByKey = new Map(stoppedShows.map((entry) => [entry.mediaKey, entry.stoppedAt]));
  const groups = categorizeShows(library, watchedEpisodes, settings, stoppedKeys);
  groups.stopped.sort((a, b) => (stoppedAtByKey.get(b.key) ?? '').localeCompare(stoppedAtByKey.get(a.key) ?? ''));
  const sections = [
    ['Currently Watching', groups.current],
    ["Haven't Watched for a While", groups.stale],
    ['Not Started', groups.notStarted],
    ['Up to Date', groups.upToDate],
    ['Stopped Watching', groups.stopped],
  ] as const;

  const showCount = library.filter((record) => record.item.mediaType === 'tv').length;
  const favoriteKeys = new Set(favorites.map((favorite) => favorite.mediaKey));

  return (
    <main className="page shows-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">{showCount} tracked</p>
          <h1>My Shows</h1>
        </div>
      </div>

      {showCount === 0 && (
        <div className="empty-state">
          <h2>No shows yet</h2>
          <p>Add a show from Discover or Search and it will stay here locally.</p>
        </div>
      )}

      {sections.map(([title, records]) =>
        records.length > 0 ? (
          <section className={`library-section ${title === 'Stopped Watching' ? 'stopped-section' : ''}`} key={title}>
            <div className="library-section-heading">
              <h2>{title}</h2>
              {title === 'Stopped Watching' && <small>Shows you decided not to finish</small>}
            </div>
            <div className="library-grid">
              {records.map((record) => {
                const progress = progressFor(record, watchedEpisodes, settings);
                const stopped = stoppedKeys.has(record.key);
                const upToDate = !stopped && progress.total > 0 && progress.watched === progress.total;
                return (
                  <MediaCard
                    key={record.key}
                    item={record.item}
                    tracked
                    favorite={favoriteKeys.has(record.key)}
                    showFavorite
                    showLibraryToggle={false}
                    showRemoveFromLibrary
                    showUpToDateToggle={!stopped}
                    upToDate={upToDate}
                    updating={isShowUpdating(record.item)}
                    progress={progress.percent}
                    statusBadge={stopped ? 'Did not finish' : undefined}
                    onStatusBadgeClick={stopped ? () => onToggleStopped(record.item) : undefined}
                    onToggle={() => onToggle(record.item)}
                    onRemoveFromLibrary={() => onToggle(record.item)}
                    onToggleFavorite={() => onToggleFavorite(record.item)}
                    onMarkUpToDate={() => onMarkUpToDate(record.item)}
                    onOpen={() => onOpen(record.item)}
                  />
                );
              })}
            </div>
          </section>
        ) : null,
      )}
    </main>
  );
}
