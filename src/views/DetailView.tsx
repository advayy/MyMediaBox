import { useEffect, useMemo, useState } from 'react';
import { isAired } from '../lib/progress';
import { backdropUrl, episodeStillUrl, logoUrl, posterUrl, providerLogoUrl } from '../lib/tmdb';
import type { Episode, MediaItem, MediaRating, WatchProvider, WatchedEpisode } from '../types';
import { episodeKey } from '../types';

type Props = {
  item: MediaItem;
  tracked: boolean;
  favorite: boolean;
  watchedEpisodes: WatchedEpisode[];
  movieWatched: boolean;
  showUpToDate: boolean;
  showStopped: boolean;
  showUpdating: boolean;
  rating?: MediaRating;
  loading: boolean;
  onBack: () => void;
  onToggleLibrary: () => void;
  onToggleFavorite: () => void;
  onEpisodeToggle: (episode: Episode, watched: boolean) => Promise<void>;
  onMarkThroughEpisode: (episode: Episode) => Promise<void>;
  onSeasonToggle: (seasonNumber: number, watched: boolean) => Promise<void>;
  onMovieToggle: (watched: boolean) => void;
  onMarkUpToDate: () => void;
  onToggleStopped: () => void;
  onOpenRating: () => void;
};

function ProviderRow({ title, providers }: { title: string; providers: WatchProvider[] }) {
  if (!providers.length) return null;
  return (
    <div className="provider-group">
      <span className="provider-label">{title}</span>
      <div className="provider-list">
        {providers.map((provider) => {
          const logo = providerLogoUrl(provider.logoPath);
          return (
            <div className="provider-pill" key={`${title}:${provider.providerId}`} title={provider.name}>
              {logo ? <img src={logo} alt="" /> : <span>{provider.name.slice(0, 1)}</span>}
              <strong>{provider.name}</strong>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function DetailView({
  item,
  tracked,
  favorite,
  watchedEpisodes,
  movieWatched,
  showUpToDate,
  showStopped,
  showUpdating,
  rating,
  loading,
  onBack,
  onToggleLibrary,
  onToggleFavorite,
  onEpisodeToggle,
  onMarkThroughEpisode,
  onSeasonToggle,
  onMovieToggle,
  onMarkUpToDate,
  onToggleStopped,
  onOpenRating,
}: Props) {
  const latestRegularSeason = useMemo(() => {
    const regularSeasons = (item.seasons ?? []).filter((season) => season.seasonNumber > 0);
    const airedSeasons = regularSeasons.filter((season) => season.episodes.some((episode) => isAired(episode.airDate)));
    const candidates = airedSeasons.length ? airedSeasons : regularSeasons;
    return candidates.length ? Math.max(...candidates.map((season) => season.seasonNumber)) : null;
  }, [item.seasons]);

  const [openSeasons, setOpenSeasons] = useState<Set<number>>(
    () => new Set(latestRegularSeason === null ? [] : [latestRegularSeason]),
  );
  const [pendingEpisode, setPendingEpisode] = useState<Episode | null>(null);
  const [episodeActionKey, setEpisodeActionKey] = useState<string | null>(null);
  const [seasonActionNumber, setSeasonActionNumber] = useState<number | null>(null);
  const [watchActionError, setWatchActionError] = useState<string | null>(null);
  const [expandedEpisodes, setExpandedEpisodes] = useState<Set<number>>(() => new Set());

  useEffect(() => {
    setOpenSeasons(new Set(latestRegularSeason === null ? [] : [latestRegularSeason]));
    setPendingEpisode(null);
    setEpisodeActionKey(null);
    setSeasonActionNumber(null);
    setWatchActionError(null);
    setExpandedEpisodes(new Set());
  }, [item.provider, item.mediaType, item.providerId, latestRegularSeason]);
  const watchedKeys = useMemo(() => new Set(watchedEpisodes.map((x) => x.episodeKey)), [watchedEpisodes]);
  const poster = posterUrl(item.posterPath);
  const backdrop = backdropUrl(item.backdropPath);
  const logo = logoUrl(item.logoPath);
  const year = item.releaseDate?.slice(0, 4);
  const availability = item.watchAvailability;
  const ratingLabel = item.mediaType === 'movie' ? item.certification : item.contentRating;
  const hasAvailability = Boolean(availability);

  function toggleEpisodeDescription(episodeId: number) {
    setExpandedEpisodes((current) => {
      const next = new Set(current);
      if (next.has(episodeId)) next.delete(episodeId);
      else next.add(episodeId);
      return next;
    });
  }

  return (
    <main className="page detail-page">
      <button className="back-button" onClick={onBack}>← Back</button>
      <section
        className={`detail-hero ${backdrop ? 'has-backdrop' : ''} ${hasAvailability ? 'with-streaming' : ''}`}
        style={backdrop ? {
          backgroundImage: `linear-gradient(90deg, rgba(30,30,30,.98) 0%, rgba(30,30,30,.88) 38%, rgba(30,30,30,.25) 76%, rgba(30,30,30,.7) 100%), linear-gradient(0deg, #1e1e1e 0%, rgba(30,30,30,0) 46%), url(${backdrop})`,
        } : undefined}
      >
        <div className="detail-poster">
          {poster ? <img src={poster} alt="" /> : <div className="poster-placeholder large"><span>{item.title[0]}</span><small>{item.title}</small></div>}
        </div>
        <div className="detail-copy">
          <p className="eyebrow">{item.mediaType === 'tv' ? 'TV Show' : 'Movie'}</p>
          {logo ? (
            <>
              <img className="detail-title-logo" src={logo} alt={item.title} />
              <h1 className="sr-only">{item.title}</h1>
            </>
          ) : <h1>{item.title}</h1>}
          <div className="metadata-chips">
            {year && <span>{year}</span>}
            {ratingLabel && <span>{ratingLabel}</span>}
            {item.runtimeMinutes ? <span>{item.runtimeMinutes} min</span> : null}
            {typeof item.voteAverage === 'number' && item.voteAverage > 0 ? <span>★ {item.voteAverage.toFixed(1)}</span> : null}
            {item.status && <span>{item.status}</span>}
          </div>
          <div className="genre-line">{item.genres.join(' · ')}</div>
          <p className="overview">{item.overview || 'No overview available.'}</p>
          <div className="detail-actions">
            <button className={`primary-action ${tracked ? 'tracked' : ''}`} onClick={onToggleLibrary}>
              {tracked ? '✓ In library' : '+ Add to library'}
            </button>
            <button
              className={`favorite-action ${favorite ? 'favorite' : ''}`}
              onClick={onToggleFavorite}
              aria-label={favorite ? `Remove ${item.title} from favorites` : `Favorite ${item.title}`}
            >
              <span>{favorite ? '♥' : '♡'}</span>
              {favorite ? 'Favorite' : 'Add favorite'}
            </button>
            <button className={`rating-action ${rating ? 'rated' : ''}`} onClick={onOpenRating}>
              <span>★</span>
              {rating ? `${rating.rating.toFixed(1)} / 10` : 'Rate'}
            </button>
            {item.mediaType === 'movie' ? (
              <button className={`watch-action ${movieWatched ? 'watched' : ''}`} onClick={() => onMovieToggle(!movieWatched)}>
                <span>{movieWatched ? '✓' : '○'}</span>
                {movieWatched ? 'Watched' : 'Mark watched'}
              </button>
            ) : (
              <>
                <button
                  className={`watch-action ${showUpToDate ? 'watched' : ''} ${showUpdating ? 'updating' : ''}`}
                  onClick={onMarkUpToDate}
                  disabled={showUpToDate || showUpdating}
                  aria-busy={showUpdating}
                >
                  <span>{showUpdating ? '↻' : '✓'}</span>
                  {showUpdating ? 'Updating…' : showUpToDate ? 'Up to date' : 'Mark up to date'}
                </button>
                <button
                  className={`stop-watching-action ${showStopped ? 'stopped' : ''}`}
                  onClick={onToggleStopped}
                  disabled={showUpdating}
                  title={showStopped ? 'Move this show back into active tracking' : 'Keep your existing history but move this show to Stopped Watching'}
                >
                  <span>{showStopped ? '↻' : '⏹'}</span>
                  {showStopped ? 'Resume watching' : 'Stop watching'}
                </button>
              </>
            )}
          </div>
        </div>

        {availability && (
          <aside className="streaming-panel detail-streaming-column">
            <div className="streaming-column-heading">
              <p className="eyebrow">Availability in {availability.region}</p>
              <h2>Where to watch</h2>
            </div>
            <ProviderRow title="Stream" providers={availability.stream} />
            <ProviderRow title="Free" providers={availability.free} />
            <ProviderRow title="With ads" providers={availability.ads} />
            <ProviderRow title="Rent" providers={availability.rent} />
            <ProviderRow title="Buy" providers={availability.buy} />
            {!availability.stream.length && !availability.free.length && !availability.ads.length && !availability.rent.length && !availability.buy.length && (
              <p className="muted">No provider availability is currently listed for this region.</p>
            )}
            <small className="justwatch-credit">Streaming availability data powered by JustWatch via TMDB.</small>
          </aside>
        )}
      </section>

      {item.mediaType === 'tv' && (
        loading ? (
          <div className="detail-loading">Loading episode list…</div>
        ) : !item.seasons?.length ? (
          <div className="empty-state">
            <h2>Episode data not cached yet</h2>
            <p>With a TMDB token configured, opening this show will fetch and cache its seasons and episodes.</p>
          </div>
        ) : (
          <section className="season-list">
            {item.seasons
              .slice()
              .sort((a, b) => b.seasonNumber - a.seasonNumber)
              .map((season) => {
                const eligible = season.episodes.filter((episode) => isAired(episode.airDate));
                const watchedCount = eligible.filter((episode) => watchedKeys.has(episodeKey(item, episode))).length;
                const allWatched = eligible.length > 0 && watchedCount === eligible.length;
                const someWatched = watchedCount > 0 && !allWatched;
                const open = openSeasons.has(season.seasonNumber);

                return (
                  <div className="season" key={season.id}>
                    <div className="season-header">
                      <button
                        className="season-toggle"
                        onClick={() => {
                          const next = new Set(openSeasons);
                          if (open) next.delete(season.seasonNumber);
                          else next.add(season.seasonNumber);
                          setOpenSeasons(next);
                        }}
                      >
                        <span>{open ? '▾' : '▸'}</span>
                        <strong>{season.name}</strong>
                        <small>{watchedCount}/{eligible.length}</small>
                      </button>
                      <button
                        type="button"
                        className={`check-hit-target season-check-control ${allWatched ? 'checked' : ''} ${someWatched ? 'partial' : ''}`}
                        title={allWatched ? 'Mark this season unwatched' : 'Mark all aired episodes in this season watched'}
                        aria-pressed={allWatched}
                        disabled={seasonActionNumber === season.seasonNumber}
                        onClick={async () => {
                          setWatchActionError(null);
                          setSeasonActionNumber(season.seasonNumber);
                          try {
                            await onSeasonToggle(season.seasonNumber, !allWatched);
                          } catch (error) {
                            console.error(error);
                            setWatchActionError('Could not update watched state. Please try again.');
                          } finally {
                            setSeasonActionNumber(null);
                          }
                        }}
                      >
                        <span className="check-box" aria-hidden="true">{seasonActionNumber === season.seasonNumber ? '…' : allWatched ? '✓' : someWatched ? '—' : ''}</span>
                      </button>
                    </div>

                    {open && (
                      <div className="episode-list">
                        {season.episodes.map((episode) => {
                          const aired = isAired(episode.airDate);
                          const checked = watchedKeys.has(episodeKey(item, episode));
                          const hasEarlierUnwatched = Boolean(
                            item.seasons
                              ?.filter((candidate) => candidate.seasonNumber > 0)
                              .flatMap((candidate) => candidate.episodes)
                              .filter((candidate) => isAired(candidate.airDate))
                              .filter((candidate) =>
                                candidate.seasonNumber < episode.seasonNumber ||
                                (candidate.seasonNumber === episode.seasonNumber && candidate.episodeNumber < episode.episodeNumber),
                              )
                              .some((candidate) => !watchedKeys.has(episodeKey(item, candidate))),
                          );
                          const pending = pendingEpisode?.id === episode.id;
                          const expanded = expandedEpisodes.has(episode.id);
                          const still = episodeStillUrl(episode.stillPath);

                          return (
                            <div className="episode-row-wrap" key={episode.id}>
                              <div className={`episode-row ${!aired ? 'future' : ''}`}>
                                <button
                                  type="button"
                                  className="episode-still-button"
                                  onClick={() => toggleEpisodeDescription(episode.id)}
                                  aria-expanded={expanded}
                                  title="Show episode description"
                                >
                                  {still ? <img src={still} alt="" loading="lazy" /> : <span>{`E${episode.episodeNumber}`}</span>}
                                </button>
                                <span className="episode-number">E{String(episode.episodeNumber).padStart(2, '0')}</span>
                                <button
                                  type="button"
                                  className="episode-summary-button"
                                  onClick={() => toggleEpisodeDescription(episode.id)}
                                  aria-expanded={expanded}
                                >
                                  <span className="episode-name">{episode.name}</span>
                                  <small>{expanded ? 'Hide details' : 'Episode details'}</small>
                                </button>
                                <span className="episode-date">{episode.airDate ?? 'TBA'}</span>
                                <button
                                  type="button"
                                  className={`check-hit-target episode-check-control ${checked ? 'checked' : ''} ${!aired ? 'disabled' : ''} ${pending ? 'pending' : ''}`}
                                  title={aired ? (checked ? 'Mark unwatched' : 'Mark watched') : 'Future episode'}
                                  aria-pressed={checked}
                                  aria-label={`${checked ? 'Mark unwatched' : 'Mark watched'}: ${episode.name}`}
                                  disabled={!aired || episodeActionKey === episodeKey(item, episode)}
                                  onClick={async () => {
                                    const nextWatched = !checked;
                                    if (nextWatched && hasEarlierUnwatched) {
                                      setPendingEpisode(episode);
                                      setWatchActionError(null);
                                      return;
                                    }
                                    const actionKey = episodeKey(item, episode);
                                    setPendingEpisode(null);
                                    setWatchActionError(null);
                                    setEpisodeActionKey(actionKey);
                                    try {
                                      await onEpisodeToggle(episode, nextWatched);
                                    } catch (error) {
                                      console.error(error);
                                      setWatchActionError('Could not update watched state. Please try again.');
                                    } finally {
                                      setEpisodeActionKey(null);
                                    }
                                  }}
                                >
                                  <span className="check-box" aria-hidden="true">{episodeActionKey === episodeKey(item, episode) ? '…' : checked ? '✓' : ''}</span>
                                </button>
                              </div>

                              {expanded && (
                                <div className="episode-description-panel">
                                  <strong className="episode-description-label">Episode description</strong>
                                  <p>{episode.overview || 'No episode description is available yet.'}</p>
                                </div>
                              )}

                              {pending && (
                                <div className="episode-bulk-choice">
                                  <span>Mark earlier episodes watched too?</span>
                                  <div className="episode-bulk-actions">
                                    <button
                                      type="button"
                                      disabled={episodeActionKey === episodeKey(item, episode)}
                                      onClick={async () => {
                                        const actionKey = episodeKey(item, episode);
                                        setWatchActionError(null);
                                        setEpisodeActionKey(actionKey);
                                        try {
                                          await onEpisodeToggle(episode, true);
                                          setPendingEpisode(null);
                                        } catch (error) {
                                          console.error(error);
                                          setWatchActionError('Could not mark this episode watched. Please try again.');
                                        } finally {
                                          setEpisodeActionKey(null);
                                        }
                                      }}
                                    >
                                      {episodeActionKey === episodeKey(item, episode) ? 'Updating…' : 'Just this episode'}
                                    </button>
                                    <button
                                      type="button"
                                      className="bulk-primary"
                                      disabled={episodeActionKey === episodeKey(item, episode)}
                                      onClick={async () => {
                                        const actionKey = episodeKey(item, episode);
                                        setWatchActionError(null);
                                        setEpisodeActionKey(actionKey);
                                        try {
                                          await onMarkThroughEpisode(episode);
                                          setPendingEpisode(null);
                                        } catch (error) {
                                          console.error(error);
                                          setWatchActionError('Could not mark previous episodes watched. Please try again.');
                                        } finally {
                                          setEpisodeActionKey(null);
                                        }
                                      }}
                                    >
                                      {episodeActionKey === episodeKey(item, episode) ? 'Updating…' : 'This + all previous'}
                                    </button>
                                  </div>
                                </div>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                );
              })}
          </section>
        )
      )}

      {watchActionError && (
        <div className="watch-action-error" role="status">{watchActionError}</div>
      )}
    </main>
  );
}
