import { MediaCard } from '../components/MediaCard';
import type { MediaItem } from '../types';

type Props = {
  query: string;
  results: MediaItem[];
  loading: boolean;
  canLoadMore: boolean;
  isTracked: (item: MediaItem) => boolean;
  isShowUpToDate: (item: MediaItem) => boolean;
  isShowUpdating: (item: MediaItem) => boolean;
  isMovieWatched: (item: MediaItem) => boolean;
  onToggle: (item: MediaItem) => void;
  onMarkShowUpToDate: (item: MediaItem) => void;
  onToggleMovieWatched: (item: MediaItem, watched: boolean) => void;
  onOpen: (item: MediaItem) => void;
  onLoadMore: () => void;
};

export function SearchView({ query, results, loading, canLoadMore, isTracked, isShowUpToDate, isShowUpdating, isMovieWatched, onToggle, onMarkShowUpToDate, onToggleMovieWatched, onOpen, onLoadMore }: Props) {
  return (
    <main className="page search-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">Search</p>
          <h1>{query ? `Results for “${query}”` : 'Search movies and shows'}</h1>
        </div>
      </div>

      {!loading && results.length === 0 ? (
        <div className="empty-state">
          <h2>No matches</h2>
          <p>Try another title or use Discover filters for a broader search.</p>
        </div>
      ) : (
        <>
          <div className="media-grid discover-grid search-grid">
            {results.map((item, index) => (
              <MediaCard
                key={`search:${item.provider}:${item.mediaType}:${item.providerId}:${index}`}
                item={item}
                tracked={isTracked(item)}
                showUpToDateToggle={item.mediaType === 'tv'}
                upToDate={isShowUpToDate(item)}
                showWatchedToggle={item.mediaType === 'movie'}
                watched={isMovieWatched(item)}
                updating={isShowUpdating(item)}
                onToggle={() => onToggle(item)}
                onMarkUpToDate={() => onMarkShowUpToDate(item)}
                onToggleWatched={() => onToggleMovieWatched(item, !isMovieWatched(item))}
                onOpen={() => onOpen(item)}
              />
            ))}
          </div>
          {loading && <div className="search-page-loading">Searching…</div>}
          {!loading && canLoadMore && <button className="load-more" onClick={onLoadMore}>Load more results</button>}
        </>
      )}
    </main>
  );
}
