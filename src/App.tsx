import { useEffect, useMemo, useRef, useState } from 'react';
import { TopNav, type MainView } from './components/TopNav';
import { RatingDialog } from './components/RatingDialog';
import { createStorage, type StorageAdapter } from './lib/storage';
import { demoSections } from './lib/demoData';
import { getDiscoverSections, getPersonalRecommendations, hydrateMedia, searchMedia } from './lib/tmdb';
import { createAutomaticBackup, exportBackupFile, importBackupFile, listAutomaticBackups } from './lib/dataSafety';
import { isAired, progressFor } from './lib/progress';
import type {
  AppSettings,
  DiscoverSection,
  Episode,
  Favorite,
  LibraryRecord,
  MediaItem,
  MediaRating,
  StorageMode,
  StoppedShow,
  WatchedEpisode,
  WatchedMovie,
} from './types';
import { DEFAULT_SETTINGS, episodeKey, mediaKey } from './types';
import { DiscoverView } from './views/DiscoverView';
import { ShowsView } from './views/ShowsView';
import { UpcomingView } from './views/UpcomingView';
import { MoviesView } from './views/MoviesView';
import { StatsView } from './views/StatsView';
import { WatchedView } from './views/WatchedView';
import { SearchView } from './views/SearchView';
import { DetailView } from './views/DetailView';
import { SettingsView } from './views/SettingsView';
import { applySkin } from './lib/theme';
import appLogo from './assets/branding/mymediabox-logo-64.png';

type View = MainView | 'detail' | 'search';
type ReturnView = MainView | 'search';

const CATCH_UP_CACHE_FRESH_MS = 12 * 60 * 60 * 1000;

export default function App() {
  const storageRef = useRef<StorageAdapter | null>(null);
  if (!storageRef.current) storageRef.current = createStorage();
  const storage = storageRef.current;

  const [view, setView] = useState<View>('discover');
  const [returnView, setReturnView] = useState<ReturnView>('discover');
  const [lastBrowseView, setLastBrowseView] = useState<Exclude<MainView, 'settings'>>('discover');
  const [library, setLibrary] = useState<LibraryRecord[]>([]);
  const [watchedEpisodes, setWatchedEpisodes] = useState<WatchedEpisode[]>([]);
  const [watchedMovies, setWatchedMovies] = useState<WatchedMovie[]>([]);
  const [favorites, setFavorites] = useState<Favorite[]>([]);
  const [ratings, setRatings] = useState<MediaRating[]>([]);
  const [stoppedShows, setStoppedShows] = useState<StoppedShow[]>([]);
  const [settings, setSettings] = useState<AppSettings>(DEFAULT_SETTINGS);
  const [sections, setSections] = useState<DiscoverSection[]>(demoSections);
  const [recommendationSections, setRecommendationSections] = useState<DiscoverSection[]>([]);
  const [backupNames, setBackupNames] = useState<string[]>([]);
  const [dataMessage, setDataMessage] = useState<string | null>(null);
  const [selected, setSelected] = useState<MediaItem | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [ratingPromptItem, setRatingPromptItem] = useState<MediaItem | null>(null);
  const [discoverLoading, setDiscoverLoading] = useState(true);
  const [discoverError, setDiscoverError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState<MediaItem[]>([]);
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [fullSearchResults, setFullSearchResults] = useState<MediaItem[]>([]);
  const [fullSearchPage, setFullSearchPage] = useState(1);
  const [fullSearchLoading, setFullSearchLoading] = useState(false);
  const [fullSearchCanLoadMore, setFullSearchCanLoadMore] = useState(false);
  const showUpdateKeysRef = useRef<Set<string>>(new Set());
  const [showUpdateKeys, setShowUpdateKeys] = useState<Set<string>>(() => new Set());
  const [ready, setReady] = useState(false);

  const mode: StorageMode = storage.mode;

  useEffect(() => {
    applySkin(settings);
  }, [
    settings.skin,
    settings.retroAccent,
    settings.retroDesktop,
    settings.retroSurface,
    settings.completionColor,
    settings.incompleteColor,
    settings.discoverTabColor,
    settings.moviesTabColor,
    settings.showsTabColor,
    settings.upcomingTabColor,
    settings.historyTabColor,
    settings.statsTabColor,
    settings.upToDateTagColor,
    settings.completedTagColor,
    settings.didNotFinishTagColor,
    settings.ratingColor,
    settings.favoriteColor,
    settings.customSkinEnabled,
    settings.customSkinCss,
  ]);

  function setShowUpdating(key: string, updating: boolean) {
    if (updating) showUpdateKeysRef.current.add(key);
    else showUpdateKeysRef.current.delete(key);
    setShowUpdateKeys(new Set(showUpdateKeysRef.current));
  }

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [localLibrary, localEpisodes, localMovies, localFavorites, localRatings, localStoppedShows, localSettings] = await Promise.all([
        storage.getLibrary(),
        storage.getWatchedEpisodes(),
        storage.getWatchedMovies(),
        storage.getFavorites(),
        storage.getRatings(),
        storage.getStoppedShows(),
        storage.getSettings(),
      ]);
      if (cancelled) return;
      setLibrary(localLibrary);
      setWatchedEpisodes(localEpisodes);
      setWatchedMovies(localMovies);
      setFavorites(localFavorites);
      setRatings(localRatings);
      setStoppedShows(localStoppedShows);
      setSettings(localSettings);
      setReady(true);
      void refreshDiscover(localSettings);
      void createAutomaticBackup(storage)
        .then(() => listAutomaticBackups())
        .then(setBackupNames)
        .catch((error) => console.warn('Automatic backup failed', error));

      if (localSettings.tmdbToken) {
        void refreshTrackedMetadata(localLibrary, localSettings);
      }
    })().catch((error) => {
      console.error(error);
      setReady(true);
      setDiscoverError('Could not open local storage');
    });
    return () => {
      cancelled = true;
    };
  }, []);

  async function refreshDiscover(nextSettings: AppSettings) {
    setDiscoverLoading(true);
    setDiscoverError(null);
    try {
      const nextSections = await getDiscoverSections(nextSettings);
      setSections(nextSections);
    } catch (error) {
      console.error(error);
      setDiscoverError('Metadata refresh failed');
      setSections(demoSections);
    } finally {
      setDiscoverLoading(false);
    }
  }

  async function refreshTrackedMetadata(records: LibraryRecord[], nextSettings: AppSettings) {
    const tmdbRecords = records.filter((record) => record.item.provider === 'tmdb');
    for (const record of tmdbRecords) {
      try {
        const hydrated = await hydrateMedia(record.item, nextSettings);
        const updated = await storage.putLibraryItem(hydrated);
        setLibrary((current) => [updated, ...current.filter((x) => x.key !== updated.key)]);
        setSelected((current) => (current && mediaKey(current) === updated.key ? updated.item : current));
      } catch (error) {
        console.warn(`Could not refresh ${record.item.title}`, error);
      }
    }
  }

  const libraryKeys = useMemo(() => new Set(library.map((record) => record.key)), [library]);
  const favoriteKeys = useMemo(() => new Set(favorites.map((favorite) => favorite.mediaKey)), [favorites]);
  const ratingsByKey = useMemo(() => new Map(ratings.map((rating) => [rating.mediaKey, rating])), [ratings]);
  const stoppedShowKeys = useMemo(() => new Set(stoppedShows.map((entry) => entry.mediaKey)), [stoppedShows]);
  const recommendationSignature = useMemo(() => {
    const episodeShows = Array.from(new Set(watchedEpisodes.map((entry) => entry.mediaKey))).sort();
    return [
      ...ratings.map((entry) => `r:${entry.mediaKey}:${entry.rating}`).sort(),
      ...favorites.map((entry) => `f:${entry.mediaKey}`).sort(),
      ...watchedMovies.map((entry) => `m:${entry.mediaKey}`).sort(),
      ...episodeShows.map((key) => `e:${key}`),
      ...library.map((record) => `l:${record.key}`).sort(),
      ...stoppedShows.map((entry) => `d:${entry.mediaKey}`).sort(),
    ].join('|');
  }, [ratings, favorites, watchedMovies, watchedEpisodes, library, stoppedShows]);

  useEffect(() => {
    if (!ready || !settings.tmdbToken || !recommendationSignature) {
      setRecommendationSections([]);
      return;
    }
    const timer = window.setTimeout(() => {
      const byKey = new Map(library.map((record) => [record.key, record.item]));
      const orderedKeys = [
        ...ratings.filter((entry) => entry.rating >= 7).sort((a, b) => b.rating - a.rating || b.ratedAt.localeCompare(a.ratedAt)).map((entry) => entry.mediaKey),
        ...favorites.slice().sort((a, b) => b.favoritedAt.localeCompare(a.favoritedAt)).map((entry) => entry.mediaKey),
        ...watchedMovies.slice().sort((a, b) => b.watchedAt.localeCompare(a.watchedAt)).map((entry) => entry.mediaKey),
        ...watchedEpisodes.slice().sort((a, b) => b.watchedAt.localeCompare(a.watchedAt)).map((entry) => entry.mediaKey),
      ];
      const seeds: MediaItem[] = [];
      const seen = new Set<string>();
      for (const key of orderedKeys) {
        if (seen.has(key) || stoppedShowKeys.has(key)) continue;
        const item = byKey.get(key);
        if (item) { seeds.push(item); seen.add(key); }
      }
      const excluded = new Set(library.map((record) => record.key));
      Promise.all([
        getPersonalRecommendations('tv', seeds, excluded, settings),
        getPersonalRecommendations('movie', seeds, excluded, settings),
      ]).then((rows) => setRecommendationSections(rows.filter((row): row is DiscoverSection => Boolean(row))))
        .catch((error) => console.warn('Recommendation refresh failed', error));
    }, 650);
    return () => window.clearTimeout(timer);
  }, [ready, recommendationSignature, settings.tmdbToken, settings.language, settings.region, settings.safeSearch]);

  const isTracked = (item: MediaItem) => libraryKeys.has(mediaKey(item));
  const isFavorite = (item: MediaItem) => favoriteKeys.has(mediaKey(item));
  const ratingFor = (item: MediaItem) => ratingsByKey.get(mediaKey(item));
  const isShowUpdating = (item: MediaItem) => showUpdateKeys.has(mediaKey(item));
  const isMovieWatched = (item: MediaItem) => item.mediaType === 'movie' && watchedMovies.some((entry) => entry.mediaKey === mediaKey(item));
  const isShowStopped = (item: MediaItem) => item.mediaType === 'tv' && stoppedShowKeys.has(mediaKey(item));
  const isShowUpToDate = (item: MediaItem) => {
    if (item.mediaType !== 'tv' || stoppedShowKeys.has(mediaKey(item))) return false;
    const record = library.find((candidate) => candidate.key === mediaKey(item));
    if (!record) return false;
    const progress = progressFor(record, watchedEpisodes, settings);
    return progress.total > 0 && progress.watched === progress.total;
  };

  async function ensureTracked(item: MediaItem) {
    const key = mediaKey(item);
    if (libraryKeys.has(key)) return;
    const record = await storage.putLibraryItem(item);
    setLibrary((current) => [record, ...current.filter((candidate) => candidate.key !== key)]);
  }

  async function hydrateTrackedInBackground(item: MediaItem) {
    if (item.provider !== 'tmdb' || !settings.tmdbToken) return;
    try {
      const hydrated = await hydrateMedia(item, settings);
      const updated = await storage.putLibraryItem(hydrated);
      setLibrary((current) => [updated, ...current.filter((record) => record.key !== updated.key)]);
      setSelected((current) => (current && mediaKey(current) === updated.key ? updated.item : current));
    } catch (error) {
      console.warn('Background metadata hydration failed', error);
    }
  }

  async function toggleLibrary(item: MediaItem) {
    const key = mediaKey(item);
    if (libraryKeys.has(key)) {
      await storage.removeLibraryItem(key);
      setLibrary((current) => current.filter((record) => record.key !== key));
      setFavorites((current) => current.filter((favorite) => favorite.mediaKey !== key));
      setStoppedShows((current) => current.filter((entry) => entry.mediaKey !== key));
      return;
    }

    const immediate = await storage.putLibraryItem(item);
    setLibrary((current) => [immediate, ...current.filter((record) => record.key !== key)]);
    void hydrateTrackedInBackground(item);
  }

  async function toggleFavorite(item: MediaItem) {
    const key = mediaKey(item);
    const nextFavorite = !favoriteKeys.has(key);
    if (nextFavorite) await ensureTracked(item);
    await storage.setFavorite(item, nextFavorite);
    setFavorites((current) => {
      const filtered = current.filter((favorite) => favorite.mediaKey !== key);
      return nextFavorite ? [...filtered, { mediaKey: key, favoritedAt: new Date().toISOString() }] : filtered;
    });
    if (nextFavorite && item.provider === 'tmdb' && settings.tmdbToken) void hydrateTrackedInBackground(item);
  }

  async function toggleShowStopped(item: MediaItem) {
    if (item.mediaType !== 'tv') return;
    const key = mediaKey(item);
    const nextStopped = !stoppedShowKeys.has(key);
    if (nextStopped) await ensureTracked(item);
    await storage.setShowStopped(item, nextStopped);
    setStoppedShows((current) => {
      const filtered = current.filter((entry) => entry.mediaKey !== key);
      return nextStopped ? [...filtered, { mediaKey: key, stoppedAt: new Date().toISOString() }] : filtered;
    });
    if (nextStopped && item.provider === 'tmdb' && settings.tmdbToken) void hydrateTrackedInBackground(item);
  }

  async function saveRating(item: MediaItem, value: number | null) {
    const key = mediaKey(item);
    if (value === null) {
      await storage.setRating(item, null);
      setRatings((current) => current.filter((entry) => entry.mediaKey !== key));
      return;
    }

    const rating = Math.max(0, Math.min(10, Math.round(value * 2) / 2));
    const ratedAt = new Date().toISOString();
    await ensureTracked(item);
    await storage.setRating(item, rating);
    setRatings((current) => [
      ...current.filter((entry) => entry.mediaKey !== key),
      { mediaKey: key, rating, ratedAt },
    ]);

    // A movie rating is an explicit statement that the movie was watched.
    if (item.mediaType === 'movie' && !watchedMovies.some((entry) => entry.mediaKey === key)) {
      await storage.setMovieWatched(item, true);
      setWatchedMovies((current) => [
        ...current.filter((entry) => entry.mediaKey !== key),
        { mediaKey: key, watchedAt: ratedAt },
      ]);
    }

    if (item.provider === 'tmdb' && settings.tmdbToken) void hydrateTrackedInBackground(item);
  }

  function shouldPromptForCompletedShow(item: MediaItem, newlyWatchedKeys: Set<string>) {
    if (!settings.promptForRatingAfterWatch || ratingsByKey.has(mediaKey(item))) return false;
    const eligible = item.seasons
      ?.filter((season) => season.seasonNumber > 0)
      .flatMap((season) => season.episodes)
      .filter((episode) => isAired(episode.airDate)) ?? [];
    if (!eligible.length) return false;
    const alreadyWatched = new Set(
      watchedEpisodes.filter((entry) => entry.mediaKey === mediaKey(item)).map((entry) => entry.episodeKey),
    );
    newlyWatchedKeys.forEach((key) => alreadyWatched.add(key));
    return eligible.every((episode) => alreadyWatched.has(episodeKey(item, episode)));
  }

  async function openItem(item: MediaItem, returnTarget?: ReturnView) {
    setReturnView(returnTarget ?? (view === 'detail' ? returnView : (view as ReturnView)));
    const cached = library.find((record) => record.key === mediaKey(item))?.item ?? item;
    setSelected(cached);
    setView('detail');
    if (returnTarget !== 'search') setSearch('');

    const shouldHydrate = cached.provider === 'tmdb' && settings.tmdbToken && (
      cached.mediaType === 'movie' || !cached.seasons?.length || !Object.prototype.hasOwnProperty.call(cached, 'watchAvailability')
    );
    if (!shouldHydrate) return;

    setDetailLoading(true);
    try {
      const hydrated = await hydrateMedia(cached, settings);
      setSelected(hydrated);
      if (isTracked(cached)) {
        const updated = await storage.putLibraryItem(hydrated);
        setLibrary((current) => [updated, ...current.filter((record) => record.key !== updated.key)]);
      }
    } catch (error) {
      console.warn(error);
    } finally {
      setDetailLoading(false);
    }
  }

  function watchedEntry(item: MediaItem, episode: Episode): WatchedEpisode {
    return {
      episodeKey: episodeKey(item, episode),
      mediaKey: mediaKey(item),
      episodeId: episode.id,
      seasonNumber: episode.seasonNumber,
      episodeNumber: episode.episodeNumber,
      watchedAt: new Date().toISOString(),
    };
  }

  async function writeEpisodeState(item: MediaItem, episode: Episode, watched: boolean) {
    const key = episodeKey(item, episode);
    const entry = watchedEntry(item, episode);
    await storage.setEpisodeWatched(item, entry, watched);
    setWatchedEpisodes((current) => {
      const filtered = current.filter((candidate) => candidate.episodeKey !== key);
      return watched ? [...filtered, entry] : filtered;
    });
  }

  async function toggleEpisode(item: MediaItem, episode: Episode, watched: boolean) {
    if (watched) await ensureTracked(item);
    await writeEpisodeState(item, episode, watched);
    if (watched) {
      const keys = new Set([episodeKey(item, episode)]);
      if (shouldPromptForCompletedShow(item, keys)) setRatingPromptItem(item);
    }
  }

  async function writeEpisodesBulk(item: MediaItem, episodes: Episode[], watched: boolean) {
    const entries = episodes.map((episode) => watchedEntry(item, episode));
    if (!entries.length) return new Set<string>();
    await storage.setEpisodesWatched(item, entries, watched);
    const keys = new Set(entries.map((entry) => entry.episodeKey));
    setWatchedEpisodes((current) => [
      ...current.filter((entry) => !keys.has(entry.episodeKey)),
      ...(watched ? entries : []),
    ]);
    return keys;
  }

  async function markThroughEpisode(item: MediaItem, target: Episode) {
    await ensureTracked(item);
    const episodes = item.seasons
      ?.filter((season) => season.seasonNumber > 0)
      .flatMap((season) => season.episodes)
      .filter((episode) => isAired(episode.airDate))
      .filter((episode) =>
        episode.seasonNumber < target.seasonNumber ||
        (episode.seasonNumber === target.seasonNumber && episode.episodeNumber <= target.episodeNumber),
      ) ?? [];

    const keys = await writeEpisodesBulk(item, episodes, true);
    if (shouldPromptForCompletedShow(item, keys)) setRatingPromptItem(item);
  }

  async function toggleSeason(item: MediaItem, seasonNumber: number, watched: boolean) {
    const season = item.seasons?.find((candidate) => candidate.seasonNumber === seasonNumber);
    if (!season) return;
    const aired = season.episodes.filter((episode) => isAired(episode.airDate));
    if (watched) await ensureTracked(item);

    const keys = await writeEpisodesBulk(item, aired, watched);
    if (watched && shouldPromptForCompletedShow(item, keys)) setRatingPromptItem(item);
  }

  async function markShowUpToDate(item: MediaItem) {
    if (item.mediaType !== 'tv') return;
    const key = mediaKey(item);
    if (showUpdateKeysRef.current.has(key)) return;

    if (stoppedShowKeys.has(key)) {
      await storage.setShowStopped(item, false);
      setStoppedShows((current) => current.filter((entry) => entry.mediaKey !== key));
    }

    // The outer-card action is intentionally a background job: flip the UI
    // into an updating state immediately, then use cached episode data first
    // and refresh TMDB only when the cache is missing/stale.
    setShowUpdating(key, true);
    let target = library.find((record) => record.key === key)?.item ?? item;
    let record = library.find((candidate) => candidate.key === key);
    const allMarkedKeys = new Set<string>();

    try {
      if (!record) {
        record = await storage.putLibraryItem(target);
        setLibrary((current) => [record!, ...current.filter((candidate) => candidate.key !== key)]);
      }

      const markKnownEpisodes = async (candidate: MediaItem) => {
        const aired = (candidate.seasons ?? [])
          .filter((season) => settings.includeSpecialsInProgress || season.seasonNumber !== 0)
          .flatMap((season) => season.episodes)
          .filter((episode) => isAired(episode.airDate));
        const keys = await writeEpisodesBulk(candidate, aired, true);
        keys.forEach((episodeKeyValue) => allMarkedKeys.add(episodeKeyValue));
      };

      const hasCachedEpisodes = Boolean(target.seasons?.some((season) => season.episodes.length));
      if (hasCachedEpisodes) {
        // Cached data makes repeat catch-up actions effectively local/instant.
        await markKnownEpisodes(target);
      }

      const updatedAt = record?.updatedAt ? Date.parse(record.updatedAt) : 0;
      const cacheFresh = hasCachedEpisodes && Number.isFinite(updatedAt)
        && Date.now() - updatedAt < CATCH_UP_CACHE_FRESH_MS;
      const shouldHydrate = target.provider === 'tmdb'
        && Boolean(settings.tmdbToken)
        && (!hasCachedEpisodes || !cacheFresh);

      if (shouldHydrate) {
        try {
          target = await hydrateMedia(target, settings);
          const updated = await storage.putLibraryItem(target);
          record = updated;
          setLibrary((current) => [updated, ...current.filter((candidate) => candidate.key !== key)]);
          setSelected((current) => (current && mediaKey(current) === key ? target : current));
          // Upsert all aired episodes in one bulk transaction. If cached data
          // was already applied, this also picks up any episodes that aired
          // since the previous metadata refresh.
          await markKnownEpisodes(target);
        } catch (error) {
          console.warn('Could not refresh show while marking it up to date; cached progress was kept', error);
        }
      }

      if (allMarkedKeys.size && shouldPromptForCompletedShow(target, allMarkedKeys)) {
        setRatingPromptItem(target);
      }
    } finally {
      setShowUpdating(key, false);
    }
  }

  async function toggleMovie(item: MediaItem, watched: boolean) {
    if (watched) await ensureTracked(item);
    await storage.setMovieWatched(item, watched);
    const key = mediaKey(item);
    setWatchedMovies((current) => {
      const filtered = current.filter((entry) => entry.mediaKey !== key);
      return watched ? [...filtered, { mediaKey: key, watchedAt: new Date().toISOString() }] : filtered;
    });
    if (watched && settings.promptForRatingAfterWatch && !ratingsByKey.has(key)) setRatingPromptItem(item);
  }

  async function saveSettings(next: AppSettings) {
    await storage.saveSettings(next);
    setSettings(next);
    await refreshDiscover(next);
    if (next.tmdbToken) void refreshTrackedMetadata(library, next);
  }

  async function clearLibrary() {
    await storage.clearLibrary();
    setLibrary([]);
    setFavorites([]);
    setStoppedShows([]);
  }

  async function reloadLocalState() {
    const [nextLibrary, nextEpisodes, nextMovies, nextFavorites, nextRatings, nextStoppedShows, nextSettings] = await Promise.all([
      storage.getLibrary(),
      storage.getWatchedEpisodes(),
      storage.getWatchedMovies(),
      storage.getFavorites(),
      storage.getRatings(),
      storage.getStoppedShows(),
      storage.getSettings(),
    ]);
    setLibrary(nextLibrary);
    setWatchedEpisodes(nextEpisodes);
    setWatchedMovies(nextMovies);
    setFavorites(nextFavorites);
    setRatings(nextRatings);
    setStoppedShows(nextStoppedShows);
    setSettings(nextSettings);
    await refreshDiscover(nextSettings);
  }

  async function backupNow() {
    try {
      if (storage.mode === 'browser') {
        const saved = await exportBackupFile(storage);
        if (saved) setDataMessage('Portable JSON backup exported. Browser demo data does not have an automatic backup folder.');
        return;
      }
      const filename = await createAutomaticBackup(storage, true);
      setBackupNames(await listAutomaticBackups());
      setDataMessage(filename ? `Backup created: ${filename}` : 'Backup created.');
    } catch (error) {
      console.error(error);
      setDataMessage('Backup failed.');
    }
  }

  async function exportData() {
    try {
      const saved = await exportBackupFile(storage);
      if (saved) setDataMessage('Portable JSON backup exported. API tokens are intentionally excluded.');
    } catch (error) {
      console.error(error);
      setDataMessage('Export failed.');
    }
  }

  async function importData() {
    try {
      await createAutomaticBackup(storage, true);
      const imported = await importBackupFile(storage);
      if (!imported) return;
      await reloadLocalState();
      setBackupNames(await listAutomaticBackups());
      setDataMessage('Backup restored. Your existing TMDB token was preserved.');
    } catch (error) {
      console.error(error);
      setDataMessage(error instanceof Error ? error.message : 'Import failed.');
    }
  }

  useEffect(() => {
    if (!ready || search.trim().length < 2) {
      setSearchResults([]);
      return;
    }
    const timer = window.setTimeout(() => {
      searchMedia(search, settings)
        .then(setSearchResults)
        .catch(() => setSearchResults([]));
    }, 300);
    return () => window.clearTimeout(timer);
  }, [search, settings, ready]);

  function navigate(target: MainView) {
    if (target !== 'settings') setLastBrowseView(target);
    setView(target);
    setSelected(null);
    setSearch('');
  }

  function openSearchItem(item: MediaItem) {
    const normalized = search.trim();

    // Quick-search results are still part of a search session. Prepare the full
    // Search view before opening the title so Back returns to those results
    // instead of whichever main tab happened to be underneath the search box.
    if (normalized.length >= 2) {
      setSubmittedSearch(normalized);
      setFullSearchResults(searchResults);
      setFullSearchPage(1);
      setFullSearchCanLoadMore(Boolean(settings.tmdbToken) && searchResults.length >= 20);
      void openItem(item, 'search');
      return;
    }

    const target: ReturnView = view === 'settings' || view === 'detail'
      ? lastBrowseView
      : (view as Exclude<MainView, 'settings'>);
    void openItem(item, target);
  }

  async function submitSearch(query: string) {
    const normalized = query.trim();
    if (normalized.length < 2) return;
    setSubmittedSearch(normalized);
    setView('search');
    setSelected(null);
    setFullSearchLoading(true);
    setFullSearchPage(1);
    try {
      const results = await searchMedia(normalized, settings, 1);
      setFullSearchResults(results);
      setFullSearchCanLoadMore(Boolean(settings.tmdbToken) && results.length >= 20);
    } catch (error) {
      console.warn('Search failed', error);
      setFullSearchResults([]);
      setFullSearchCanLoadMore(false);
    } finally {
      setFullSearchLoading(false);
    }
  }

  async function loadMoreSearch() {
    if (fullSearchLoading || !submittedSearch) return;
    const nextPage = fullSearchPage + 1;
    setFullSearchLoading(true);
    try {
      const results = await searchMedia(submittedSearch, settings, nextPage);
      setFullSearchResults((current) => [...current, ...results]);
      setFullSearchPage(nextPage);
      setFullSearchCanLoadMore(results.length >= 20);
    } catch (error) {
      console.warn('Could not load more search results', error);
      setFullSearchCanLoadMore(false);
    } finally {
      setFullSearchLoading(false);
    }
  }

  if (!ready) {
    return <div className="boot-screen"><img className="boot-logo-image" src={appLogo} alt="MyMediaBox" /><span>Opening local library…</span></div>;
  }

  const accentView = view === 'detail'
    ? (selected?.mediaType === 'movie' ? 'movies' : 'shows')
    : view === 'search'
      ? 'discover'
      : view;

  return (
    <div className="app-shell" data-accent={accentView}>
      <TopNav
        view={view}
        onNavigate={navigate}
        search={search}
        setSearch={setSearch}
        results={searchResults}
        isTracked={isTracked}
        isShowUpToDate={isShowUpToDate}
        isShowUpdating={isShowUpdating}
        isMovieWatched={isMovieWatched}
        onToggle={(item) => void toggleLibrary(item)}
        onMarkShowUpToDate={(item) => void markShowUpToDate(item)}
        onToggleMovieWatched={(item, watched) => void toggleMovie(item, watched)}
        onOpen={openSearchItem}
        onSearchSubmit={(query) => void submitSearch(query)}
        usePixelIcons={settings.pixelNavIcons}
      />

      <div className={view === 'discover' ? 'view-layer' : 'view-layer view-layer-hidden'}>
        <DiscoverView
          sections={[...recommendationSections, ...sections]}
          loading={discoverLoading}
          error={discoverError}
          liveMetadata={Boolean(settings.tmdbToken)}
          settings={settings}
          isTracked={isTracked}
          isShowUpToDate={isShowUpToDate}
          isShowUpdating={isShowUpdating}
          isMovieWatched={isMovieWatched}
          onToggle={(item) => void toggleLibrary(item)}
          onMarkShowUpToDate={(item) => void markShowUpToDate(item)}
          onToggleMovieWatched={(item, watched) => void toggleMovie(item, watched)}
          onOpen={(item) => void openItem(item, 'discover')}
        />
      </div>
      {view === 'shows' && (
        <ShowsView
          library={library}
          watchedEpisodes={watchedEpisodes}
          favorites={favorites}
          stoppedShows={stoppedShows}
          settings={settings}
          isShowUpdating={isShowUpdating}
          onToggle={(item) => void toggleLibrary(item)}
          onToggleFavorite={(item) => void toggleFavorite(item)}
          onMarkUpToDate={(item) => void markShowUpToDate(item)}
          onToggleStopped={(item) => void toggleShowStopped(item)}
          onOpen={(item) => void openItem(item)}
        />
      )}
      {view === 'watched' && (
        <WatchedView
          library={library}
          watchedEpisodes={watchedEpisodes}
          watchedMovies={watchedMovies}
          favorites={favorites}
          ratings={ratings}
          stoppedShows={stoppedShows}
          settings={settings}
          isShowUpdating={isShowUpdating}
          onToggleFavorite={(item) => void toggleFavorite(item)}
          onOpen={(item) => void openItem(item)}
          onRate={(item) => setRatingPromptItem(item)}
          onMarkUpToDate={(item) => void markShowUpToDate(item)}
          onOpenStats={() => navigate('stats')}
        />
      )}
      {view === 'search' && (
        <SearchView
          query={submittedSearch}
          results={fullSearchResults}
          loading={fullSearchLoading}
          canLoadMore={fullSearchCanLoadMore}
          isTracked={isTracked}
          isShowUpToDate={isShowUpToDate}
          isShowUpdating={isShowUpdating}
          isMovieWatched={isMovieWatched}
          onToggle={(item) => void toggleLibrary(item)}
          onMarkShowUpToDate={(item) => void markShowUpToDate(item)}
          onToggleMovieWatched={(item, watched) => void toggleMovie(item, watched)}
          onOpen={(item) => void openItem(item, 'search')}
          onLoadMore={() => void loadMoreSearch()}
        />
      )}
      {view === 'upcoming' && (
        <UpcomingView
          library={library}
          onOpen={(item) => void openItem(item)}
        />
      )}
      {view === 'movies' && (
        <MoviesView
          library={library}
          watchedMovies={watchedMovies}
          favorites={favorites}
          ratings={ratings}
          onToggle={(item) => void toggleLibrary(item)}
          onToggleWatched={(item, watched) => void toggleMovie(item, watched)}
          onToggleFavorite={(item) => void toggleFavorite(item)}
          onRate={(item) => setRatingPromptItem(item)}
          onOpen={(item) => void openItem(item)}
        />
      )}
      {view === 'stats' && (
        <StatsView
          library={library}
          watchedEpisodes={watchedEpisodes}
          watchedMovies={watchedMovies}
          favorites={favorites}
          ratings={ratings}
          settings={settings}
          isShowUpdating={isShowUpdating}
          onToggleFavorite={(item) => void toggleFavorite(item)}
          onOpen={(item) => void openItem(item)}
          onMarkUpToDate={(item) => void markShowUpToDate(item)}
        />
      )}
      {view === 'settings' && (
        <SettingsView
          settings={settings}
          mode={mode}
          backupNames={backupNames}
          dataMessage={dataMessage}
          onSave={saveSettings}
          onClearLibrary={clearLibrary}
          onBackupNow={backupNow}
          onExport={exportData}
          onImport={importData}
        />
      )}
      {view === 'detail' && selected && (
        <DetailView
          item={selected}
          tracked={isTracked(selected)}
          favorite={isFavorite(selected)}
          watchedEpisodes={watchedEpisodes.filter((entry) => entry.mediaKey === mediaKey(selected))}
          movieWatched={watchedMovies.some((entry) => entry.mediaKey === mediaKey(selected))}
          showUpToDate={isShowUpToDate(selected)}
          showStopped={isShowStopped(selected)}
          showUpdating={isShowUpdating(selected)}
          rating={ratingFor(selected)}
          loading={detailLoading}
          onBack={() => setView(returnView)}
          onToggleLibrary={() => void toggleLibrary(selected)}
          onToggleFavorite={() => void toggleFavorite(selected)}
          onEpisodeToggle={(episode, watched) => toggleEpisode(selected, episode, watched)}
          onMarkThroughEpisode={(episode) => markThroughEpisode(selected, episode)}
          onSeasonToggle={(seasonNumber, watched) => toggleSeason(selected, seasonNumber, watched)}
          onMovieToggle={(watched) => void toggleMovie(selected, watched)}
          onMarkUpToDate={() => void markShowUpToDate(selected)}
          onToggleStopped={() => void toggleShowStopped(selected)}
          onOpenRating={() => setRatingPromptItem(selected)}
        />
      )}

      <RatingDialog
        item={ratingPromptItem}
        rating={ratingPromptItem ? ratingFor(ratingPromptItem) : undefined}
        onClose={() => setRatingPromptItem(null)}
        onSave={saveRating}
      />
    </div>
  );
}
