import { useEffect, useMemo, useState } from 'react';
import type { AppSettings, DiscoverFilters, DiscoverSection, GenreOption, MediaItem, MediaType } from '../types';
import { MediaCard } from '../components/MediaCard';
import { advancedDiscover, getDiscoverSectionPage, getGenres } from '../lib/tmdb';

type Props = {
  sections: DiscoverSection[];
  loading: boolean;
  error: string | null;
  liveMetadata: boolean;
  settings: AppSettings;
  isTracked: (item: MediaItem) => boolean;
  isShowUpToDate: (item: MediaItem) => boolean;
  isShowUpdating: (item: MediaItem) => boolean;
  isMovieWatched: (item: MediaItem) => boolean;
  onToggle: (item: MediaItem) => void;
  onMarkShowUpToDate: (item: MediaItem) => void;
  onToggleMovieWatched: (item: MediaItem, watched: boolean) => void;
  onOpen: (item: MediaItem) => void;
};

function defaultFilters(mediaType: MediaType): DiscoverFilters {
  return {
    mediaType,
    query: '',
    genreIds: [],
    sortBy: 'popularity.desc',
  };
}

export function DiscoverView({ sections, loading, error, liveMetadata, settings, isTracked, isShowUpToDate, isShowUpdating, isMovieWatched, onToggle, onMarkShowUpToDate, onToggleMovieWatched, onOpen }: Props) {
  const [mediaType, setMediaType] = useState<MediaType>('tv');
  const [genres, setGenres] = useState<GenreOption[]>([]);
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [filters, setFilters] = useState<DiscoverFilters>(() => defaultFilters('tv'));
  const [advancedResults, setAdvancedResults] = useState<MediaItem[] | null>(null);
  const [advancedPage, setAdvancedPage] = useState(1);
  const [advancedLoading, setAdvancedLoading] = useState(false);
  const [activeSection, setActiveSection] = useState<DiscoverSection | null>(null);
  const [sectionItems, setSectionItems] = useState<MediaItem[]>([]);
  const [sectionPage, setSectionPage] = useState(1);
  const [sectionLoading, setSectionLoading] = useState(false);

  const visibleSections = useMemo(
    () => sections
      .map((section) => ({ ...section, items: section.items.filter((item) => item.mediaType === mediaType) }))
      .filter((section) => section.items.length > 0),
    [sections, mediaType],
  );

  useEffect(() => {
    setFilters(defaultFilters(mediaType));
    setAdvancedResults(null);
    setActiveSection(null);
    getGenres(mediaType, settings).then(setGenres).catch(() => setGenres([]));
  }, [mediaType, settings.tmdbToken, settings.language, settings.safeSearch]);

  function toggleGenre(id: number) {
    setFilters((current) => ({
      ...current,
      genreIds: current.genreIds.includes(id) ? current.genreIds.filter((genreId) => genreId !== id) : [...current.genreIds, id],
    }));
  }

  async function runAdvanced(reset = true) {
    const nextPage = reset ? 1 : advancedPage + 1;
    setAdvancedLoading(true);
    try {
      const items = await advancedDiscover({ ...filters, mediaType }, settings, nextPage);
      setAdvancedResults((current) => reset ? items : [...(current ?? []), ...items]);
      setAdvancedPage(nextPage);
      setActiveSection(null);
    } finally {
      setAdvancedLoading(false);
    }
  }

  function openSection(section: DiscoverSection) {
    setActiveSection(section);
    setSectionItems(section.items);
    setSectionPage(1);
    setAdvancedResults(null);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  async function loadMoreSection() {
    if (!activeSection?.request) return;
    setSectionLoading(true);
    try {
      const nextPage = sectionPage + 1;
      const items = await getDiscoverSectionPage(activeSection, settings, nextPage);
      setSectionItems((current) => [...current, ...items]);
      setSectionPage(nextPage);
    } finally {
      setSectionLoading(false);
    }
  }

  const resultMode = activeSection || advancedResults;

  return (
    <main className="page discover-page">
      <div className="page-heading-row">
        <div>
          <p className="eyebrow">Local-first tracking</p>
          <h1>{activeSection ? activeSection.title.replace(' · Shows', '').replace(' · Movies', '') : advancedResults ? 'Filtered discovery' : 'Discover'}</h1>
        </div>
        <div
          className="status-chip metadata-status"
          title={liveMetadata
            ? 'Titles, episodes, artwork, and discovery data are loading from TMDB. Your watch history still stays local.'
            : 'Using the small catalog bundled with MyMediaBox. Add a TMDB token in Settings for live metadata.'}
        >
          <span>Metadata database:</span>
          <strong>{loading ? 'Refreshing…' : error ? 'TMDB unavailable' : liveMetadata ? 'TMDB live' : 'Demo catalog'}</strong>
        </div>
      </div>

      {!resultMode && (
        <>
          <div className="discover-controls">
            <div className="discover-switch" role="group" aria-label="Discover media type">
              <button className={mediaType === 'tv' ? 'active' : ''} onClick={() => setMediaType('tv')}>TV Shows</button>
              <button className={mediaType === 'movie' ? 'active' : ''} onClick={() => setMediaType('movie')}>Movies</button>
            </div>
            <button className={`filter-toggle ${filtersOpen ? 'active' : ''}`} onClick={() => setFiltersOpen((value) => !value)}>
              <span>⌘</span> Filters
            </button>
          </div>

          {filtersOpen && (
            <section className="filter-panel">
              <div className="filter-grid">
                <label className="filter-wide">
                  <span>Title (optional)</span>
                  <input
                    value={filters.query}
                    onChange={(event) => setFilters({ ...filters, query: event.target.value })}
                    placeholder="Leave blank to browse every title matching the filters"
                  />
                </label>
                <label>
                  <span>Release / first-air year</span>
                  <input type="number" min="1900" max="2100" value={filters.year ?? ''} onChange={(event) => setFilters({ ...filters, year: event.target.value ? Number(event.target.value) : undefined })} placeholder="Any" />
                </label>
                <label>
                  <span>Minimum TMDB score</span>
                  <input type="number" min="0" max="10" step="0.5" value={filters.minRating ?? ''} onChange={(event) => setFilters({ ...filters, minRating: event.target.value ? Number(event.target.value) : undefined })} placeholder="Any" />
                </label>
                <label>
                  <span>Minimum votes</span>
                  <input type="number" min="0" value={filters.minVotes ?? ''} onChange={(event) => setFilters({ ...filters, minVotes: event.target.value ? Number(event.target.value) : undefined })} placeholder="Any" />
                </label>
                <label>
                  <span>Minimum runtime</span>
                  <input type="number" min="0" value={filters.minRuntime ?? ''} onChange={(event) => setFilters({ ...filters, minRuntime: event.target.value ? Number(event.target.value) : undefined })} placeholder="minutes" />
                </label>
                <label>
                  <span>Maximum runtime</span>
                  <input type="number" min="0" value={filters.maxRuntime ?? ''} onChange={(event) => setFilters({ ...filters, maxRuntime: event.target.value ? Number(event.target.value) : undefined })} placeholder="minutes" />
                </label>
                <label>
                  <span>Original language</span>
                  <input value={filters.originalLanguage ?? ''} onChange={(event) => setFilters({ ...filters, originalLanguage: event.target.value.trim().toLowerCase() || undefined })} maxLength={2} placeholder="e.g. en, ko, ja" />
                </label>
                <label>
                  <span>{mediaType === 'movie' ? 'Certification' : 'Content rating'}</span>
                  <input value={filters.certification ?? ''} onChange={(event) => setFilters({ ...filters, certification: event.target.value.trim() || undefined })} placeholder={mediaType === 'movie' ? 'e.g. PG-13, 14A' : 'e.g. TV-MA'} />
                </label>
                <label>
                  <span>Sort</span>
                  <select value={filters.sortBy} onChange={(event) => setFilters({ ...filters, sortBy: event.target.value })}>
                    <option value="popularity.desc">Popularity</option>
                    <option value="vote_average.desc">Highest rated</option>
                    <option value="vote_count.desc">Most rated</option>
                    <option value={mediaType === 'movie' ? 'primary_release_date.desc' : 'first_air_date.desc'}>Newest first</option>
                    <option value={mediaType === 'movie' ? 'primary_release_date.asc' : 'first_air_date.asc'}>Oldest first</option>
                  </select>
                </label>
              </div>

              <div className="genre-filter">
                <span>Genres</span>
                <div className="genre-chips">
                  {genres.map((genre) => (
                    <button key={genre.id} className={filters.genreIds.includes(genre.id) ? 'active' : ''} onClick={() => toggleGenre(genre.id)}>{genre.name}</button>
                  ))}
                </div>
              </div>

              <div className="filter-actions">
                <button className="secondary-action" onClick={() => setFilters(defaultFilters(mediaType))}>Reset</button>
                <button className="primary-action" disabled={advancedLoading} onClick={() => void runAdvanced(true)}>{advancedLoading ? 'Searching…' : 'Show matching titles'}</button>
              </div>
              <small className="filter-note">Blank title means “all”: TMDB Discover applies the filters directly. With a title, MyMediaBox uses TMDB Search and enriches results when runtime/rating data is needed.</small>
            </section>
          )}
        </>
      )}

      {!liveMetadata && !error && !resultMode && (
        <div className="demo-banner">Showing the bundled demo catalog. Add a TMDB Read Access Token in Settings to load the live catalog.</div>
      )}
      {error && <div className="error-banner">{error} — showing cached/demo data where possible.</div>}

      {resultMode ? (
        <section className="discover-full-page">
          <div className="full-page-actions">
            <button className="back-button" onClick={() => { setActiveSection(null); setAdvancedResults(null); }}>← Back to Discover</button>
            <span>{activeSection?.personalized ? 'Based on your local watch/favorite history' : advancedResults ? `${advancedResults.length} loaded` : `${sectionItems.length} loaded`}</span>
          </div>
          <div className="media-grid discover-grid">
            {(activeSection ? sectionItems : advancedResults ?? []).map((item, index) => (
              <MediaCard
                key={`full:${item.provider}:${item.mediaType}:${item.providerId}:${index}`}
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
          {activeSection?.request && <button className="load-more" disabled={sectionLoading} onClick={() => void loadMoreSection()}>{sectionLoading ? 'Loading…' : 'Load more'}</button>}
          {advancedResults && <button className="load-more" disabled={advancedLoading} onClick={() => void runAdvanced(false)}>{advancedLoading ? 'Loading…' : 'Load more matches'}</button>}
        </section>
      ) : (
        visibleSections.map((section) => (
          <section className={`discover-section ${section.personalized ? 'personalized-section' : ''}`} key={section.id}>
            <div className="discover-section-heading">
              <div>
                {section.personalized && <p className="eyebrow">From your local taste</p>}
                <h2>{section.title.replace(' · Shows', '').replace(' · Movies', '')}</h2>
              </div>
              <button className="section-arrow" onClick={() => openSection(section)} aria-label={`Open all ${section.title}`} title="See all">→</button>
            </div>
            <div className="media-rail">
              {section.items.map((item) => (
                <MediaCard
                  key={`${section.id}:${item.provider}:${item.mediaType}:${item.providerId}`}
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
          </section>
        ))
      )}
    </main>
  );
}
