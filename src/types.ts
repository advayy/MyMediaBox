export type MediaType = 'tv' | 'movie';
export type Provider = 'tmdb' | 'demo';

export interface Episode {
  id: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  airDate: string | null;
  overview?: string;
  stillPath?: string | null;
}

export interface Season {
  id: number;
  seasonNumber: number;
  name: string;
  airDate: string | null;
  posterPath?: string | null;
  episodes: Episode[];
}

export interface WatchProvider {
  providerId: number;
  name: string;
  logoPath: string | null;
  displayPriority?: number;
}

export interface WatchAvailability {
  region: string;
  link?: string;
  stream: WatchProvider[];
  free: WatchProvider[];
  ads: WatchProvider[];
  rent: WatchProvider[];
  buy: WatchProvider[];
}

export interface MediaItem {
  provider: Provider;
  providerId: number;
  mediaType: MediaType;
  title: string;
  originalTitle?: string;
  overview: string;
  posterPath: string | null;
  backdropPath?: string | null;
  logoPath?: string | null;
  releaseDate?: string | null;
  genres: string[];
  genreIds?: number[];
  status?: string;
  voteAverage?: number;
  voteCount?: number;
  originalLanguage?: string;
  runtimeMinutes?: number | null;
  contentRating?: string | null;
  certification?: string | null;
  watchAvailability?: WatchAvailability | null;
  seasons?: Season[];
}

export interface LibraryRecord {
  key: string;
  item: MediaItem;
  addedAt: string;
  updatedAt: string;
}

export interface WatchedEpisode {
  episodeKey: string;
  mediaKey: string;
  episodeId: number;
  seasonNumber: number;
  episodeNumber: number;
  watchedAt: string;
}

export interface WatchedMovie {
  mediaKey: string;
  watchedAt: string;
}

export interface Favorite {
  mediaKey: string;
  favoritedAt: string;
}

export interface MediaRating {
  mediaKey: string;
  rating: number;
  ratedAt: string;
}

export interface StoppedShow {
  mediaKey: string;
  stoppedAt: string;
}

export type AppSkin = 'retro98' | 'modern';

export interface AppSettings {
  staleDays: number;
  includeSpecialsInProgress: boolean;
  promptForRatingAfterWatch: boolean;
  safeSearch: boolean;
  skin: AppSkin;
  pixelNavIcons: boolean;
  retroAccent: string;
  retroDesktop: string;
  retroSurface: string;
  completionColor: string;
  incompleteColor: string;
  discoverTabColor: string;
  moviesTabColor: string;
  showsTabColor: string;
  upcomingTabColor: string;
  historyTabColor: string;
  statsTabColor: string;
  upToDateTagColor: string;
  completedTagColor: string;
  didNotFinishTagColor: string;
  ratingColor: string;
  favoriteColor: string;
  customSkinEnabled: boolean;
  customSkinCss: string;
  tmdbToken: string;
  language: string;
  region: string;
}

export interface DiscoverRequest {
  path: string;
  params?: Record<string, string | number | boolean>;
}

export interface DiscoverSection {
  id: string;
  title: string;
  items: MediaItem[];
  request?: DiscoverRequest;
  personalized?: boolean;
}

export interface GenreOption {
  id: number;
  name: string;
}

export interface DiscoverFilters {
  mediaType: MediaType;
  query: string;
  genreIds: number[];
  year?: number;
  minRating?: number;
  minVotes?: number;
  minRuntime?: number;
  maxRuntime?: number;
  originalLanguage?: string;
  certification?: string;
  sortBy: string;
}

export interface BackupSnapshot {
  schemaVersion: 1 | 2 | 3;
  app: 'MyMediaBox' | 'IMissTVTime';
  appVersion: string;
  exportedAt: string;
  library: LibraryRecord[];
  watchedEpisodes: WatchedEpisode[];
  watchedMovies: WatchedMovie[];
  favorites: Favorite[];
  ratings?: MediaRating[];
  stoppedShows?: StoppedShow[];
  settings: Partial<Omit<AppSettings, 'tmdbToken'>> & { tmdbToken?: string };
}

export type StorageMode = 'sqlite' | 'browser';

export const DEFAULT_SETTINGS: AppSettings = {
  staleDays: 30,
  includeSpecialsInProgress: false,
  promptForRatingAfterWatch: false,
  safeSearch: true,
  skin: 'retro98',
  pixelNavIcons: true,
  retroAccent: '#aa96d9',
  retroDesktop: '#9d9d9d',
  retroSurface: '#c0c0c0',
  completionColor: '#00c853',
  incompleteColor: '#3f3f3f',
  discoverTabColor: '#aa96d9',
  moviesTabColor: '#d98282',
  showsTabColor: '#e3c85f',
  upcomingTabColor: '#81d8d0',
  historyTabColor: '#e89a4f',
  statsTabColor: '#5578d1',
  upToDateTagColor: '#a8d6b4',
  completedTagColor: '#aa96d9',
  didNotFinishTagColor: '#8f6bab',
  ratingColor: '#d6b84f',
  favoriteColor: '#d995b1',
  customSkinEnabled: false,
  customSkinCss: '',
  tmdbToken: import.meta.env.VITE_TMDB_READ_TOKEN ?? '',
  language: 'en-US',
  region: 'CA',
};

export const APP_VERSION = '1.0.0';

export function mediaKey(item: Pick<MediaItem, 'provider' | 'providerId' | 'mediaType'>): string {
  return `${item.provider}:${item.mediaType}:${item.providerId}`;
}

export function episodeKey(item: MediaItem, episode: Episode): string {
  return `${mediaKey(item)}:s${episode.seasonNumber}:e${episode.episodeNumber}`;
}
