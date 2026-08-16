import { MediaCard } from '../components/MediaCard';
import type { Favorite, LibraryRecord, MediaItem, MediaRating, WatchedMovie } from '../types';

type Props = {
  library: LibraryRecord[];
  watchedMovies: WatchedMovie[];
  favorites: Favorite[];
  ratings: MediaRating[];
  onToggle: (item: MediaItem) => void;
  onToggleWatched: (item: MediaItem, watched: boolean) => void;
  onToggleFavorite: (item: MediaItem) => void;
  onRate: (item: MediaItem) => void;
  onOpen: (item: MediaItem) => void;
};

export function MoviesView({
  library,
  watchedMovies,
  favorites,
  ratings,
  onToggle,
  onToggleWatched,
  onToggleFavorite,
  onRate,
  onOpen,
}: Props) {
  const movies = library.filter((record) => record.item.mediaType === 'movie');
  const watched = new Set(watchedMovies.map((entry) => entry.mediaKey));
  const favoriteKeys = new Set(favorites.map((favorite) => favorite.mediaKey));
  const ratingsByKey = new Map(ratings.map((rating) => [rating.mediaKey, rating.rating]));
  const toWatch = movies.filter((record) => !watched.has(record.key));
  const watchedRecords = movies
    .filter((record) => watched.has(record.key))
    .sort((a, b) => {
      const aDate = watchedMovies.find((entry) => entry.mediaKey === a.key)?.watchedAt ?? '';
      const bDate = watchedMovies.find((entry) => entry.mediaKey === b.key)?.watchedAt ?? '';
      return bDate.localeCompare(aDate);
    });

  function renderCards(records: LibraryRecord[]) {
    return (
      <div className="library-grid">
        {records.map((record) => {
          const isWatched = watched.has(record.key);
          return (
            <MediaCard
              key={record.key}
              item={record.item}
              tracked
              favorite={favoriteKeys.has(record.key)}
              showFavorite
              showRating
              rating={ratingsByKey.get(record.key)}
              showLibraryToggle={false}
              showWatchedToggle
              watched={isWatched}
              showRemoveFromLibrary
              onToggle={() => onToggle(record.item)}
              onToggleWatched={() => onToggleWatched(record.item, !isWatched)}
              onRemoveFromLibrary={() => onToggle(record.item)}
              onToggleFavorite={() => onToggleFavorite(record.item)}
              onRate={() => onRate(record.item)}
              onOpen={() => onOpen(record.item)}
            />
          );
        })}
      </div>
    );
  }

  return (
    <main className="page movies-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">{movies.length} tracked</p>
          <h1>My Movies</h1>
        </div>
      </div>
      {movies.length === 0 ? (
        <div className="empty-state">
          <h2>No movies yet</h2>
          <p>Add movies from Discover or global search.</p>
        </div>
      ) : (
        <>
          {toWatch.length > 0 && (
            <section className="library-section">
              <h2>Want to Watch</h2>
              {renderCards(toWatch)}
            </section>
          )}
          {watchedRecords.length > 0 && (
            <section className="library-section watched-movies-section">
              <h2>Watched</h2>
              {renderCards(watchedRecords)}
            </section>
          )}
        </>
      )}
    </main>
  );
}
