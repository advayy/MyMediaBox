import { useState } from 'react';
import type { LibraryRecord, MediaItem } from '../types';

type Props = {
  library: LibraryRecord[];
  onOpen: (item: MediaItem) => void;
};

type UpcomingEpisode = {
  date: string;
  record: LibraryRecord;
  seasonNumber: number;
  episodeNumber: number;
  episodeName: string;
};

type UpcomingMovie = {
  date: string;
  record: LibraryRecord;
};

function upcomingEpisodesFor(records: LibraryRecord[]): UpcomingEpisode[] {
  const today = new Date().toISOString().slice(0, 10);
  return records
    .filter((record) => record.item.mediaType === 'tv')
    .flatMap((record) =>
      (record.item.seasons ?? [])
        .filter((season) => season.seasonNumber > 0)
        .flatMap((season) =>
          season.episodes
            .filter((episode) => Boolean(episode.airDate && episode.airDate > today))
            .map((episode) => ({
              date: episode.airDate as string,
              record,
              seasonNumber: episode.seasonNumber,
              episodeNumber: episode.episodeNumber,
              episodeName: episode.name,
            })),
        ),
    )
    .sort((a, b) => a.date.localeCompare(b.date) || a.record.item.title.localeCompare(b.record.item.title));
}

function upcomingMoviesFor(records: LibraryRecord[]): UpcomingMovie[] {
  const today = new Date().toISOString().slice(0, 10);
  return records
    .filter((record) => record.item.mediaType === 'movie' && Boolean(record.item.releaseDate && record.item.releaseDate > today))
    .map((record) => ({ date: record.item.releaseDate as string, record }))
    .sort((a, b) => a.date.localeCompare(b.date) || a.record.item.title.localeCompare(b.record.item.title));
}

function prettyDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(undefined, { weekday: 'short', month: 'short', day: 'numeric' });
}

function fullDate(date: string) {
  const parsed = new Date(`${date}T12:00:00`);
  return parsed.toLocaleDateString(undefined, { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' });
}

export function UpcomingView({ library, onOpen }: Props) {
  const [mode, setMode] = useState<'tv' | 'movie'>('tv');
  const upcomingEpisodes = upcomingEpisodesFor(library);
  const upcomingMovies = upcomingMoviesFor(library);
  const upcomingByDate = upcomingEpisodes.reduce<Map<string, UpcomingEpisode[]>>((groupsByDate, episode) => {
    const entries = groupsByDate.get(episode.date) ?? [];
    entries.push(episode);
    groupsByDate.set(episode.date, entries);
    return groupsByDate;
  }, new Map());
  const moviesByDate = upcomingMovies.reduce<Map<string, UpcomingMovie[]>>((groupsByDate, movie) => {
    const entries = groupsByDate.get(movie.date) ?? [];
    entries.push(movie);
    groupsByDate.set(movie.date, entries);
    return groupsByDate;
  }, new Map());
  const count = mode === 'tv' ? upcomingEpisodes.length : upcomingMovies.length;

  return (
    <main className="page upcoming-page">
      <div className="page-heading-row compact-heading">
        <div>
          <p className="eyebrow">{count} upcoming {mode === 'tv' ? `episode${count === 1 ? '' : 's'}` : `movie${count === 1 ? '' : 's'}`}</p>
          <h1>Upcoming</h1>
          <p className="page-subtitle">Release dates from titles already in your local library.</p>
        </div>
      </div>

      <div className="view-switch upcoming-switch" aria-label="Upcoming media type">
        <button className={mode === 'tv' ? 'active' : ''} onClick={() => setMode('tv')}>TV Shows</button>
        <button className={mode === 'movie' ? 'active' : ''} onClick={() => setMode('movie')}>Movies</button>
      </div>

      {mode === 'tv' ? (
        upcomingEpisodes.length === 0 ? (
          <div className="empty-state">
            <h2>Nothing announced yet</h2>
            <p>Upcoming episodes from your tracked shows will appear here after metadata refreshes.</p>
          </div>
        ) : (
          <section className="upcoming-section upcoming-section-full">
            <div className="upcoming-timeline">
              {[...upcomingByDate.entries()].map(([date, episodes]) => (
                <div className="timeline-day" key={date}>
                  <div className="timeline-date" title={fullDate(date)}>
                    <span className="timeline-dot" />
                    <time dateTime={date}>{prettyDate(date)}</time>
                  </div>
                  <div className="timeline-episodes">
                    {episodes.map((entry) => (
                      <button
                        className="timeline-episode"
                        key={`${entry.record.key}:${entry.seasonNumber}:${entry.episodeNumber}`}
                        onClick={() => onOpen(entry.record.item)}
                      >
                        <strong>{entry.record.item.title}</strong>
                        <span>S{String(entry.seasonNumber).padStart(2, '0')}E{String(entry.episodeNumber).padStart(2, '0')}</span>
                        <span className="timeline-episode-name">{entry.episodeName || 'Untitled episode'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      ) : (
        upcomingMovies.length === 0 ? (
          <div className="empty-state">
            <h2>No saved movies with future dates</h2>
            <p>Movies in your library with an announced future release date will appear here.</p>
          </div>
        ) : (
          <section className="upcoming-section upcoming-section-full">
            <div className="upcoming-timeline">
              {[...moviesByDate.entries()].map(([date, movies]) => (
                <div className="timeline-day" key={date}>
                  <div className="timeline-date" title={fullDate(date)}>
                    <span className="timeline-dot" />
                    <time dateTime={date}>{prettyDate(date)}</time>
                  </div>
                  <div className="timeline-episodes">
                    {movies.map((entry) => (
                      <button
                        className="timeline-episode timeline-movie"
                        key={entry.record.key}
                        onClick={() => onOpen(entry.record.item)}
                      >
                        <strong>{entry.record.item.title}</strong>
                        <span>Movie</span>
                        <span className="timeline-episode-name">{entry.record.item.genres.slice(0, 3).join(' · ') || 'Upcoming release'}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>
        )
      )}
    </main>
  );
}
