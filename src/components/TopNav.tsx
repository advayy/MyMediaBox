import { useEffect, useRef, useState } from 'react';
import type { MediaItem } from '../types';
import discoverPixel from '../assets/nav/discover-16.png';
import moviesPixel from '../assets/nav/movies-16.png';
import showsPixel from '../assets/nav/shows-16.png';
import upcomingPixel from '../assets/nav/upcoming-16.png';
import watchedPixel from '../assets/nav/watched-16.png';
import statsPixel from '../assets/nav/stats-16.png';

export type MainView = 'discover' | 'movies' | 'shows' | 'watched' | 'upcoming' | 'stats' | 'settings';

type Props = {
  view: MainView | 'detail' | 'search';
  onNavigate: (view: MainView) => void;
  search: string;
  setSearch: (value: string) => void;
  results: MediaItem[];
  isTracked: (item: MediaItem) => boolean;
  isShowUpToDate: (item: MediaItem) => boolean;
  isShowUpdating: (item: MediaItem) => boolean;
  isMovieWatched: (item: MediaItem) => boolean;
  onToggle: (item: MediaItem) => void;
  onMarkShowUpToDate: (item: MediaItem) => void;
  onToggleMovieWatched: (item: MediaItem, watched: boolean) => void;
  onOpen: (item: MediaItem) => void;
  onSearchSubmit: (query: string) => void;
  usePixelIcons: boolean;
};

type IconName = 'discover' | 'movies' | 'shows' | 'watched' | 'upcoming' | 'stats';

function EyeIcon() {
  return (
    <svg className="watch-state-icon" viewBox="0 0 24 24" aria-hidden="true">
      <path d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6S2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.75" />
    </svg>
  );
}

const pixelNavIcons: Record<IconName, string> = {
  discover: discoverPixel,
  movies: moviesPixel,
  shows: showsPixel,
  upcoming: upcomingPixel,
  watched: watchedPixel,
  stats: statsPixel,
};

function NavIcon({ name, pixel }: { name: IconName; pixel: boolean }) {
  if (pixel) return <img className="pixel-nav-icon" src={pixelNavIcons[name]} alt="" aria-hidden="true" />;
  if (name === 'discover') return <svg viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="8.5" /><path d="m14.9 9.1-1.8 4-4 1.8 1.8-4 4-1.8Z" /></svg>;
  if (name === 'movies') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="4" y="5" width="16" height="14" rx="2" /><path d="M8 5v14M16 5v14M4 9h4M16 9h4M4 15h4M16 15h4" /></svg>;
  if (name === 'shows') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="6" width="17" height="12" rx="2" /><path d="m9 3 3 3 3-3M8 21h8" /></svg>;
  if (name === 'watched') return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 6.5h16M4 12h16M4 17.5h10" /><path d="m17 16 1.7 1.7L22 14.5" /></svg>;
  if (name === 'upcoming') return <svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3.5" y="5.5" width="17" height="15" rx="2" /><path d="M7.5 3v5M16.5 3v5M3.5 10h17" /><path d="M8 14h3M13 14h3M8 17h3" /></svg>;
  return <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M4 19V11M10 19V5M16 19v-7M22 19H2" /><path d="M18.5 4.8c-1.5-1.4-4-.5-4 1.6 0 2.1 4 4.3 4 4.3s4-2.2 4-4.3c0-2.1-2.5-3-4-1.6Z" transform="translate(-2 0) scale(.75)" /></svg>;
}

const navItems: Array<{ key: Exclude<MainView, 'settings'>; label: string }> = [
  { key: 'discover', label: 'Discover' },
  { key: 'movies', label: 'My Movies' },
  { key: 'shows', label: 'My Shows' },
  { key: 'upcoming', label: 'Upcoming' },
  { key: 'watched', label: 'Watch History' },
  { key: 'stats', label: 'Your Stats' },
];

export function TopNav({ view, onNavigate, search, setSearch, results, isTracked, isShowUpToDate, isShowUpdating, isMovieWatched, onToggle, onMarkShowUpToDate, onToggleMovieWatched, onOpen, onSearchSubmit, usePixelIcons }: Props) {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    function handleOutside(event: PointerEvent) {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) setDropdownOpen(false);
    }
    document.addEventListener('pointerdown', handleOutside);
    return () => document.removeEventListener('pointerdown', handleOutside);
  }, []);

  const showDropdown = dropdownOpen && search.trim().length > 1;

  return (
    <header className="topbar">
      <div className="nav-pills">
        {navItems.map(({ key, label }) => (
          <button key={key} className={`nav-pill nav-${key} ${view === key ? 'active' : ''}`} onClick={() => onNavigate(key)}>
            <span className="nav-icon"><NavIcon name={key} pixel={usePixelIcons} /></span>
            {label}
          </button>
        ))}
      </div>

      <div className="topbar-search" ref={searchRef}>
        <div className="search-wrap">
          <span className="search-icon">⌕</span>
          <input
            aria-label="Search movies and shows"
            value={search}
            onChange={(event) => { setSearch(event.target.value); setDropdownOpen(true); }}
            onFocus={() => { if (search.trim().length > 1) setDropdownOpen(true); }}
            onKeyDown={(event) => {
              if (event.key === 'Enter' && search.trim().length > 1) {
                event.preventDefault();
                setDropdownOpen(false);
                onSearchSubmit(search.trim());
              }
              if (event.key === 'Escape') setDropdownOpen(false);
            }}
            placeholder="Search"
          />
          {showDropdown && (
            <div className="search-results">
              {results.length === 0 ? (
                <div className="search-empty">No matches</div>
              ) : (
                results.slice(0, 8).map((item) => (
                  <div className="search-result" key={`${item.provider}:${item.mediaType}:${item.providerId}`}>
                    <button className="search-title" onClick={() => { setDropdownOpen(false); onOpen(item); }}>
                      <span>{item.title}</span>
                      <small>{item.mediaType === 'tv' ? 'Show' : 'Movie'}</small>
                    </button>
                    {item.mediaType === 'tv' && (
                      <button
                        className={`tiny-caught-up ${isShowUpToDate(item) ? 'caught-up' : ''} ${isShowUpdating(item) ? 'updating' : ''}`}
                        onClick={() => { if (!isShowUpToDate(item) && !isShowUpdating(item)) onMarkShowUpToDate(item); }}
                        disabled={isShowUpToDate(item) || isShowUpdating(item)}
                        aria-busy={isShowUpdating(item)}
                        aria-label={isShowUpdating(item) ? `Updating ${item.title}` : isShowUpToDate(item) ? `${item.title} is up to date` : `Mark ${item.title} up to date`}
                        title={isShowUpdating(item) ? 'Updating aired episodes…' : isShowUpToDate(item) ? 'Up to date' : 'Mark all aired episodes watched'}
                      >
                        {isShowUpdating(item) ? '↻' : isShowUpToDate(item) ? '✓' : <EyeIcon />}
                      </button>
                    )}
                    {item.mediaType === 'movie' && (
                      <button
                        className={`tiny-caught-up ${isMovieWatched(item) ? 'caught-up' : ''}`}
                        onClick={() => onToggleMovieWatched(item, !isMovieWatched(item))}
                        aria-label={isMovieWatched(item) ? `Mark ${item.title} unwatched` : `Mark ${item.title} watched`}
                        title={isMovieWatched(item) ? 'Watched' : 'Mark watched'}
                      >
                        {isMovieWatched(item) ? '✓' : <EyeIcon />}
                      </button>
                    )}
                    <button
                      className={`tiny-add ${isTracked(item) ? 'tracked' : ''}`}
                      onClick={() => onToggle(item)}
                      aria-label={isTracked(item) ? `Remove ${item.title}` : `Add ${item.title}`}
                    >
                      {isTracked(item) ? '✓' : '+'}
                    </button>
                  </div>
                ))
              )}
              {results.length > 0 && (
                <button className="search-all" onClick={() => { setDropdownOpen(false); onSearchSubmit(search.trim()); }}>
                  See all results →
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <button className={`settings-button ${view === 'settings' ? 'active' : ''}`} onClick={() => onNavigate('settings')} aria-label="Settings" title="Settings">⚙</button>
    </header>
  );
}
