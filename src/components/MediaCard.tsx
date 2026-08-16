import type { MediaItem } from '../types';
import { posterUrl } from '../lib/tmdb';

function EyeIcon() {
  return (
    <svg className="watch-state-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

type Props = {
  item: MediaItem;
  tracked: boolean;
  progress?: number;
  favorite?: boolean;
  showFavorite?: boolean;
  showLibraryToggle?: boolean;
  showWatchedToggle?: boolean;
  watched?: boolean;
  showRemoveFromLibrary?: boolean;
  showRating?: boolean;
  rating?: number;
  showUpToDateToggle?: boolean;
  upToDate?: boolean;
  statusBadge?: string;
  updating?: boolean;
  onToggle: () => void;
  onToggleFavorite?: () => void;
  onToggleWatched?: () => void;
  onRemoveFromLibrary?: () => void;
  onRate?: () => void;
  onMarkUpToDate?: () => void;
  onStatusBadgeClick?: () => void;
  onOpen: () => void;
};

export function MediaCard({
  item,
  tracked,
  progress,
  favorite = false,
  showFavorite = false,
  showLibraryToggle = true,
  showWatchedToggle = false,
  watched = false,
  showRemoveFromLibrary = false,
  showRating = false,
  rating,
  showUpToDateToggle = false,
  upToDate = false,
  statusBadge,
  updating = false,
  onToggle,
  onToggleFavorite,
  onToggleWatched,
  onRemoveFromLibrary,
  onRate,
  onMarkUpToDate,
  onStatusBadgeClick,
  onOpen,
}: Props) {
  const poster = posterUrl(item.posterPath);
  const libraryControlLayout = showRemoveFromLibrary && (showWatchedToggle || showUpToDateToggle);
  const catalogueControlLayout = showLibraryToggle && (showWatchedToggle || showUpToDateToggle);
  return (
    <article className={`media-card ${libraryControlLayout ? 'library-control-layout' : ''} ${catalogueControlLayout ? 'catalogue-control-layout' : ''}`.trim()}>
      <button className="poster-button" onClick={onOpen} aria-label={`Open ${item.title}`}>
        {poster ? (
          <img src={poster} alt="" className="poster-image" loading="lazy" />
        ) : (
          <div className="poster-placeholder">
            <span>{item.title.slice(0, 1)}</span>
            <small>{item.title}</small>
          </div>
        )}
      </button>
      {typeof progress === 'number' && (
        <div className="progress-track" aria-label={`${progress}% complete`}>
          <div className="progress-fill" style={{ width: `${progress}%` }} />
        </div>
      )}
      {statusBadge && (
        onStatusBadgeClick ? (
          <button className="card-status-badge interactive" onClick={onStatusBadgeClick} title="Resume watching">
            {statusBadge}
          </button>
        ) : <span className="card-status-badge">{statusBadge}</span>
      )}
      {showFavorite && onToggleFavorite && (
        <button
          className={`card-favorite ${favorite ? 'favorite' : ''}`}
          onClick={onToggleFavorite}
          aria-label={favorite ? `Remove ${item.title} from favorites` : `Favorite ${item.title}`}
          title={favorite ? 'Remove favorite' : 'Favorite'}
        >
          {favorite ? '♥' : '♡'}
        </button>
      )}
      {showRating && onRate && (
        <button
          className={`card-rating ${typeof rating === 'number' ? 'rated' : ''}`}
          onClick={onRate}
          aria-label={typeof rating === 'number' ? `Change rating for ${item.title}, currently ${rating.toFixed(1)} out of 10` : `Rate ${item.title}`}
          title={typeof rating === 'number' ? `Your rating: ${rating.toFixed(1)} / 10` : 'Rate'}
        >
          <span>★</span>
          {typeof rating === 'number' && <small>{rating.toFixed(1)}</small>}
        </button>
      )}
      {showRemoveFromLibrary && onRemoveFromLibrary && (
        <button
          className="card-remove"
          onClick={onRemoveFromLibrary}
          aria-label={`Remove ${item.title} from library`}
          title="Remove from library"
        >
          −
        </button>
      )}
      {showWatchedToggle && onToggleWatched && (
        <button
          className={`card-watched ${watched ? 'watched' : ''}`}
          onClick={onToggleWatched}
          aria-label={watched ? `Mark ${item.title} unwatched` : `Mark ${item.title} watched`}
          title={watched ? 'Mark unwatched' : 'Mark watched'}
        >
          {watched ? '✓' : <EyeIcon />}
        </button>
      )}
      {showUpToDateToggle && item.mediaType === 'tv' && onMarkUpToDate && (
        <button
          className={`card-up-to-date ${upToDate ? 'caught-up' : ''} ${updating ? 'updating' : ''}`}
          onClick={() => { if (!upToDate && !updating) onMarkUpToDate(); }}
          disabled={upToDate || updating}
          aria-busy={updating}
          aria-label={updating ? `Updating ${item.title}` : upToDate ? `${item.title} is up to date` : `Mark ${item.title} up to date`}
          title={updating ? 'Updating aired episodes…' : upToDate ? 'Up to date' : 'Mark all aired episodes watched'}
        >
          {updating ? '↻' : upToDate ? '✓' : <EyeIcon />}
        </button>
      )}
      {showLibraryToggle && (
        <button
          className={`card-add ${tracked ? 'tracked' : ''}`}
          onClick={onToggle}
          aria-label={tracked ? `Remove ${item.title}` : `Add ${item.title}`}
        >
          {tracked ? '✓' : '+'}
        </button>
      )}
    </article>
  );
}
