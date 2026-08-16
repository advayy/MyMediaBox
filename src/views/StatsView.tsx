import { MediaCard } from '../components/MediaCard';
import { progressFor } from '../lib/progress';
import type { AppSettings, Favorite, LibraryRecord, MediaItem, MediaRating, WatchedEpisode, WatchedMovie } from '../types';
import { episodeKey } from '../types';

type Props = {
  library: LibraryRecord[];
  watchedEpisodes: WatchedEpisode[];
  watchedMovies: WatchedMovie[];
  favorites: Favorite[];
  ratings: MediaRating[];
  settings: AppSettings;
  isShowUpdating: (item: MediaItem) => boolean;
  onToggleFavorite: (item: MediaItem) => void;
  onOpen: (item: MediaItem) => void;
  onMarkUpToDate: (item: MediaItem) => void;
};

type Score = { label: string; value: number };

function ranked(map: Map<string, number>): Score[] {
  return [...map.entries()]
    .map(([label, value]) => ({ label, value }))
    .sort((a, b) => b.value - a.value || a.label.localeCompare(b.label));
}

function addScore(map: Map<string, number>, label: string, amount = 1) {
  map.set(label, (map.get(label) ?? 0) + amount);
}

export function StatsView({
  library,
  watchedEpisodes,
  watchedMovies,
  favorites,
  ratings,
  settings,
  isShowUpdating,
  onToggleFavorite,
  onOpen,
  onMarkUpToDate,
}: Props) {
  const byKey = new Map(library.map((record) => [record.key, record]));
  const favoriteKeys = new Set(favorites.map((favorite) => favorite.mediaKey));
  const favoriteRecords = favorites
    .map((favorite) => byKey.get(favorite.mediaKey))
    .filter((record): record is LibraryRecord => Boolean(record));

  const startedShows = library.filter(
    (record) => record.item.mediaType === 'tv' && (watchedEpisodes.some((episode) => episode.mediaKey === record.key) || ratings.some((rating) => rating.mediaKey === record.key)),
  ).length;
  const completedShows = library.filter(
    (record) => record.item.mediaType === 'tv' && progressFor(record, watchedEpisodes, settings).percent === 100,
  ).length;

  const watchedTvGenres = new Map<string, number>();
  const watchedMovieGenres = new Map<string, number>();
  for (const record of library) {
    if (record.item.mediaType === 'tv') {
      const episodeCount = watchedEpisodes.filter((episode) => episode.mediaKey === record.key).length;
      const weight = episodeCount || (ratings.some((rating) => rating.mediaKey === record.key) ? 1 : 0);
      if (weight > 0) record.item.genres.forEach((genre) => addScore(watchedTvGenres, genre, weight));
    } else if (watchedMovies.some((movie) => movie.mediaKey === record.key)) {
      record.item.genres.forEach((genre) => addScore(watchedMovieGenres, genre));
    }
  }

  const likedGenres = new Map<string, number>();
  for (const rating of ratings) {
    const record = byKey.get(rating.mediaKey);
    if (!record) continue;
    record.item.genres.forEach((genre) => addScore(likedGenres, genre, rating.rating));
  }

  const watchedYears = new Map<string, number>();
  for (const entry of watchedEpisodes) {
    const record = byKey.get(entry.mediaKey);
    const episode = record?.item.seasons
      ?.flatMap((season) => season.episodes)
      .find((candidate) => episodeKey(record.item, candidate) === entry.episodeKey);
    const year = episode?.airDate?.slice(0, 4);
    if (year) addScore(watchedYears, year);
  }
  for (const entry of watchedMovies) {
    const year = byKey.get(entry.mediaKey)?.item.releaseDate?.slice(0, 4);
    if (year) addScore(watchedYears, year);
  }
  for (const rating of ratings) {
    const record = byKey.get(rating.mediaKey);
    if (!record || record.item.mediaType !== 'tv') continue;
    if (watchedEpisodes.some((entry) => entry.mediaKey === rating.mediaKey)) continue;
    const year = record.item.releaseDate?.slice(0, 4);
    if (year) addScore(watchedYears, year);
  }

  const watchedTvGenreRanking = ranked(watchedTvGenres);
  const watchedMovieGenreRanking = ranked(watchedMovieGenres);
  const likedGenreRanking = ranked(likedGenres);
  const yearRanking = ranked(watchedYears);
  const maxTvGenre = watchedTvGenreRanking[0]?.value ?? 1;
  const maxMovieGenre = watchedMovieGenreRanking[0]?.value ?? 1;
  const maxLikedGenre = likedGenreRanking[0]?.value ?? 1;
  const averageRating = ratings.length ? ratings.reduce((sum, entry) => sum + entry.rating, 0) / ratings.length : null;

  return (
    <main className="page stats-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">Calculated from your local data</p>
          <h1>Your Stats</h1>
        </div>
      </div>

      <section className="stats-grid" aria-label="Viewing summary">
        <div className="stat-card tv-stat"><strong>{watchedEpisodes.length}</strong><span>Episodes watched</span></div>
        <div className="stat-card movie-stat"><strong>{watchedMovies.length}</strong><span>Movies watched</span></div>
        <div className="stat-card tv-stat"><strong>{startedShows}</strong><span>Shows watched / started</span></div>
        <div className="stat-card tv-stat"><strong>{completedShows}</strong><span>Shows caught up / complete</span></div>
        <div className="stat-card rating-stat"><strong>{ratings.length}</strong><span>Titles rated</span></div>
        <div className="stat-card stats-stat"><strong>{averageRating === null ? '—' : averageRating.toFixed(1)}</strong><span>Average rating</span></div>
        <div className="stat-card favorite-stat"><strong>{favorites.length}</strong><span>Favorites</span></div>
        <div className="stat-card stats-stat"><strong>{yearRanking[0]?.label ?? '—'}</strong><span>Most-watched year</span></div>
      </section>

      <section className="taste-grid taste-grid-media">
        <div className="taste-card tv-taste-card">
          <p className="eyebrow">Your TV history</p>
          <h2>TV genres</h2>
          {watchedTvGenreRanking.length === 0 ? (
            <p className="muted">Mark some episodes watched to build this.</p>
          ) : (
            <div className="rank-list">
              {watchedTvGenreRanking.slice(0, 5).map((genre) => (
                <div className="rank-row" key={genre.label}>
                  <div className="rank-label"><span>{genre.label}</span><strong>{genre.value}</strong></div>
                  <div className="rank-track tv-rank"><span style={{ width: `${Math.max(8, (genre.value / maxTvGenre) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="taste-card movie-taste-card">
          <p className="eyebrow">Your movie history</p>
          <h2>Movie genres</h2>
          {watchedMovieGenreRanking.length === 0 ? (
            <p className="muted">Mark some movies watched to build this.</p>
          ) : (
            <div className="rank-list">
              {watchedMovieGenreRanking.slice(0, 5).map((genre) => (
                <div className="rank-row" key={genre.label}>
                  <div className="rank-label"><span>{genre.label}</span><strong>{genre.value}</strong></div>
                  <div className="rank-track movie-rank"><span style={{ width: `${Math.max(8, (genre.value / maxMovieGenre) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="taste-card liked-taste-card">
          <p className="eyebrow">Weighted by your 0–10 ratings</p>
          <h2>Most liked genres</h2>
          {likedGenreRanking.length === 0 ? (
            <p className="muted">Rate a few movies or shows to build this.</p>
          ) : (
            <div className="rank-list">
              {likedGenreRanking.slice(0, 5).map((genre) => (
                <div className="rank-row" key={genre.label}>
                  <div className="rank-label"><span>{genre.label}</span><strong>{genre.value.toFixed(1)}</strong></div>
                  <div className="rank-track rating-rank"><span style={{ width: `${Math.max(8, (genre.value / maxLikedGenre) * 100)}%` }} /></div>
                </div>
              ))}
            </div>
          )}
        </div>
      </section>

      <section className="library-section stats-favorites">
        <div className="section-title-row">
          <div>
            <p className="eyebrow">Your picks</p>
            <h2>Favorites</h2>
          </div>
        </div>
        {favoriteRecords.length === 0 ? (
          <div className="empty-state compact-empty"><p>Use the heart on a movie or show and it will appear here.</p></div>
        ) : (
          <div className="library-grid">
            {favoriteRecords.map((record) => (
              <MediaCard
                key={record.key}
                item={record.item}
                tracked
                favorite={favoriteKeys.has(record.key)}
                showFavorite
                showLibraryToggle={false}
                showUpToDateToggle={record.item.mediaType === 'tv'}
                upToDate={record.item.mediaType === 'tv' && progressFor(record, watchedEpisodes, settings).percent === 100}
                updating={isShowUpdating(record.item)}
                onToggle={() => undefined}
                onMarkUpToDate={() => onMarkUpToDate(record.item)}
                onToggleFavorite={() => onToggleFavorite(record.item)}
                onOpen={() => onOpen(record.item)}
              />
            ))}
          </div>
        )}
      </section>
    </main>
  );
}
