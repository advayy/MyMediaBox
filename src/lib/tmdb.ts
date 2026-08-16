import type {
  AppSettings,
  DiscoverFilters,
  DiscoverRequest,
  DiscoverSection,
  Episode,
  GenreOption,
  MediaItem,
  MediaType,
  Season,
  WatchAvailability,
  WatchProvider,
} from '../types';
import { mediaKey } from '../types';
import { demoMovies, demoSections, demoShows } from './demoData';

const API_ROOT = 'https://api.themoviedb.org/3';
export const IMAGE_ROOT = 'https://image.tmdb.org/t/p/w342';
export const BACKDROP_ROOT = 'https://image.tmdb.org/t/p/w1280';
export const LOGO_ROOT = 'https://image.tmdb.org/t/p/w500';
export const PROVIDER_LOGO_ROOT = 'https://image.tmdb.org/t/p/w92';
export const EPISODE_STILL_ROOT = 'https://image.tmdb.org/t/p/w300';

function isTauri() {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}

async function appFetch(input: string, init?: RequestInit): Promise<Response> {
  if (isTauri()) {
    const { fetch } = await import('@tauri-apps/plugin-http');
    return fetch(input, init);
  }
  return globalThis.fetch(input, init);
}

async function tmdbFetch<T>(path: string, settings: AppSettings, params: Record<string, string | number | boolean> = {}): Promise<T> {
  if (!settings.tmdbToken) throw new Error('TMDB token missing');
  const url = new URL(`${API_ROOT}${path}`);
  url.searchParams.set('language', settings.language);
  for (const [key, value] of Object.entries(params)) url.searchParams.set(key, String(value));

  const response = await appFetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${settings.tmdbToken}`,
      Accept: 'application/json',
    },
  });

  if (!response.ok) throw new Error(`TMDB request failed (${response.status})`);
  return response.json() as Promise<T>;
}

function mapTv(result: any, genres: Map<number, string> = new Map()): MediaItem {
  const genreIds = result.genre_ids ?? result.genres?.map((g: any) => g.id) ?? [];
  return {
    provider: 'tmdb',
    providerId: result.id,
    mediaType: 'tv',
    title: result.name,
    originalTitle: result.original_name,
    overview: result.overview ?? '',
    posterPath: result.poster_path ?? null,
    backdropPath: result.backdrop_path ?? null,
    releaseDate: result.first_air_date ?? null,
    genres: result.genres?.map((g: any) => g.name) ?? genreIds.map((id: number) => genres.get(id)).filter(Boolean) as string[],
    genreIds,
    status: result.status,
    voteAverage: typeof result.vote_average === 'number' ? result.vote_average : undefined,
    voteCount: typeof result.vote_count === 'number' ? result.vote_count : undefined,
    originalLanguage: result.original_language,
    runtimeMinutes: result.episode_run_time?.find((value: number) => value > 0) ?? result.last_episode_to_air?.runtime ?? null,
  };
}

function mapMovie(result: any, genres: Map<number, string> = new Map()): MediaItem {
  const genreIds = result.genre_ids ?? result.genres?.map((g: any) => g.id) ?? [];
  return {
    provider: 'tmdb',
    providerId: result.id,
    mediaType: 'movie',
    title: result.title,
    originalTitle: result.original_title,
    overview: result.overview ?? '',
    posterPath: result.poster_path ?? null,
    backdropPath: result.backdrop_path ?? null,
    releaseDate: result.release_date ?? null,
    genres: result.genres?.map((g: any) => g.name) ?? genreIds.map((id: number) => genres.get(id)).filter(Boolean) as string[],
    genreIds,
    status: result.status,
    voteAverage: typeof result.vote_average === 'number' ? result.vote_average : undefined,
    voteCount: typeof result.vote_count === 'number' ? result.vote_count : undefined,
    originalLanguage: result.original_language,
    runtimeMinutes: typeof result.runtime === 'number' ? result.runtime : null,
  };
}

function mapEpisode(raw: any): Episode {
  return {
    id: raw.id,
    seasonNumber: raw.season_number,
    episodeNumber: raw.episode_number,
    name: raw.name,
    airDate: raw.air_date ?? null,
    overview: raw.overview ?? '',
    stillPath: raw.still_path ?? null,
  };
}

function mapWatchProvider(raw: any): WatchProvider {
  return {
    providerId: raw.provider_id,
    name: raw.provider_name,
    logoPath: raw.logo_path ?? null,
    displayPriority: raw.display_priority,
  };
}

function getWatchAvailability(raw: any, region: string): WatchAvailability | null {
  const match = raw?.results?.[region.toUpperCase()];
  if (!match) return null;
  return {
    region: region.toUpperCase(),
    link: match.link,
    stream: (match.flatrate ?? []).map(mapWatchProvider),
    free: (match.free ?? []).map(mapWatchProvider),
    ads: (match.ads ?? []).map(mapWatchProvider),
    rent: (match.rent ?? []).map(mapWatchProvider),
    buy: (match.buy ?? []).map(mapWatchProvider),
  };
}

function chooseLogo(images: any, language: string): string | null {
  const lang = language.split('-')[0];
  const logos = images?.logos ?? [];
  return logos.find((logo: any) => logo.iso_639_1 === lang)?.file_path
    ?? logos.find((logo: any) => logo.iso_639_1 === null)?.file_path
    ?? logos[0]?.file_path
    ?? null;
}

function movieCertification(releaseDates: any, region: string): string | null {
  const regional = releaseDates?.results?.find((result: any) => result.iso_3166_1 === region.toUpperCase());
  if (!regional?.release_dates?.length) return null;
  const priority = [3, 2, 4, 1, 5, 6];
  for (const type of priority) {
    const match = regional.release_dates.find((entry: any) => entry.type === type && entry.certification);
    if (match?.certification) return match.certification;
  }
  return regional.release_dates.find((entry: any) => entry.certification)?.certification ?? null;
}

function tvContentRating(contentRatings: any, region: string): string | null {
  return contentRatings?.results?.find((result: any) => result.iso_3166_1 === region.toUpperCase())?.rating
    ?? contentRatings?.results?.find((result: any) => result.iso_3166_1 === 'US')?.rating
    ?? contentRatings?.results?.find((result: any) => result.rating)?.rating
    ?? null;
}

async function genreMap(mediaType: MediaType, settings: AppSettings) {
  const list = await getGenres(mediaType, settings);
  return new Map(list.map((genre) => [genre.id, genre.name]));
}

export async function getGenres(mediaType: MediaType, settings: AppSettings): Promise<GenreOption[]> {
  if (!settings.tmdbToken) {
    const names = Array.from(new Set((mediaType === 'tv' ? demoShows : demoMovies).flatMap((item) => item.genres))).sort();
    return names.map((name, index) => ({ id: -(index + 1), name }));
  }
  const data = await tmdbFetch<{ genres: GenreOption[] }>(`/genre/${mediaType}/list`, settings);
  return data.genres;
}

function section(id: string, title: string, items: MediaItem[], request?: DiscoverRequest): DiscoverSection {
  return { id, title, items, request };
}

function visibleResults(results: any[], settings: AppSettings) {
  return settings.safeSearch ? results.filter((result) => result?.adult !== true) : results;
}

export async function getDiscoverSections(settings: AppSettings): Promise<DiscoverSection[]> {
  if (!settings.tmdbToken) return demoSections;

  type Page = { results: any[] };
  const [tvGenresRaw, movieGenresRaw] = await Promise.all([getGenres('tv', settings), getGenres('movie', settings)]);
  const tvGenres = new Map(tvGenresRaw.map((g) => [g.id, g.name]));
  const movieGenres = new Map(movieGenresRaw.map((g) => [g.id, g.name]));

  const tvRequests: Array<{ id: string; title: string; path: string; params?: Record<string, string | number | boolean> }> = [
    { id: 'popular-tv', title: 'Popular Shows', path: '/tv/popular', params: { page: 1 } },
    { id: 'top-tv', title: 'Top Rated Shows', path: '/tv/top_rated', params: { page: 1 } },
    { id: 'airing-tv', title: 'Airing Today', path: '/tv/airing_today', params: { page: 1 } },
  ];
  const movieRequests: Array<{ id: string; title: string; path: string; params?: Record<string, string | number | boolean> }> = [
    { id: 'popular-movies', title: 'Popular Movies', path: '/movie/popular', params: { page: 1, region: settings.region } },
    { id: 'top-movies', title: 'Top Rated Movies', path: '/movie/top_rated', params: { page: 1, region: settings.region } },
    { id: 'now-movies', title: 'Now Playing', path: '/movie/now_playing', params: { page: 1, region: settings.region } },
  ];

  const baseRows = await Promise.all([...tvRequests, ...movieRequests].map(async (request) => {
    const page = await tmdbFetch<Page>(request.path, settings, request.params);
    const isTv = request.path.startsWith('/tv/');
    const items = visibleResults(page.results, settings).map((item) => isTv ? mapTv(item, tvGenres) : mapMovie(item, movieGenres));
    return section(request.id, request.title, items, { path: request.path, params: request.params });
  }));

  const featuredTvGenres = tvGenresRaw.slice(0, 6);
  const featuredMovieGenres = movieGenresRaw.slice(0, 6);
  const genreRows = await Promise.all([
    ...featuredTvGenres.map(async (genre) => {
      const params = { page: 1, sort_by: 'popularity.desc', with_genres: genre.id, include_adult: !settings.safeSearch };
      const page = await tmdbFetch<Page>('/discover/tv', settings, params);
      return section(`tv-genre-${genre.id}`, `${genre.name} · Shows`, visibleResults(page.results, settings).map((x) => mapTv(x, tvGenres)), { path: '/discover/tv', params });
    }),
    ...featuredMovieGenres.map(async (genre) => {
      const params = { page: 1, sort_by: 'popularity.desc', with_genres: genre.id, include_adult: !settings.safeSearch, include_video: false, region: settings.region };
      const page = await tmdbFetch<Page>('/discover/movie', settings, params);
      return section(`movie-genre-${genre.id}`, `${genre.name} · Movies`, visibleResults(page.results, settings).map((x) => mapMovie(x, movieGenres)), { path: '/discover/movie', params });
    }),
  ]);

  return [...baseRows, ...genreRows];
}

export async function getDiscoverSectionPage(section: DiscoverSection, settings: AppSettings, pageNumber: number): Promise<MediaItem[]> {
  if (!section.request || !settings.tmdbToken) return section.items;
  const params = { ...(section.request.params ?? {}), page: pageNumber };
  const result = await tmdbFetch<{ results: any[] }>(section.request.path, settings, params);
  const mediaType: MediaType = section.request.path.includes('/movie') ? 'movie' : 'tv';
  const genres = await genreMap(mediaType, settings);
  return visibleResults(result.results, settings).map((item) => mediaType === 'tv' ? mapTv(item, genres) : mapMovie(item, genres));
}

export async function searchMedia(query: string, settings: AppSettings, pageNumber = 1): Promise<MediaItem[]> {
  if (!query.trim()) return [];
  if (!settings.tmdbToken) {
    const all = [...demoShows, ...demoMovies];
    return all.filter((item) => item.title.toLowerCase().includes(query.trim().toLowerCase()));
  }
  type SearchPage = { results: any[] };
  const page = await tmdbFetch<SearchPage>('/search/multi', settings, {
    query,
    page: pageNumber,
    include_adult: !settings.safeSearch,
  });
  return visibleResults(page.results, settings)
    .filter((result) => result.media_type === 'tv' || result.media_type === 'movie')
    .map((result) => (result.media_type === 'tv' ? mapTv(result) : mapMovie(result)));
}

async function hydrateFilterMetadata(item: MediaItem, settings: AppSettings): Promise<MediaItem> {
  if (item.mediaType === 'movie') {
    const [details, releaseDates] = await Promise.all([
      tmdbFetch<any>(`/movie/${item.providerId}`, settings),
      tmdbFetch<any>(`/movie/${item.providerId}/release_dates`, settings),
    ]);
    const certification = movieCertification(releaseDates, settings.region);
    return { ...item, ...mapMovie(details), certification, contentRating: certification };
  }
  const [details, contentRatings] = await Promise.all([
    tmdbFetch<any>(`/tv/${item.providerId}`, settings),
    tmdbFetch<any>(`/tv/${item.providerId}/content_ratings`, settings),
  ]);
  const rating = tvContentRating(contentRatings, settings.region);
  return { ...item, ...mapTv(details), certification: rating, contentRating: rating };
}

function matchesBasicFilters(item: MediaItem, filters: DiscoverFilters, genreLookup: Map<number, string>) {
  const year = item.releaseDate ? Number(item.releaseDate.slice(0, 4)) : undefined;
  if (filters.year && year !== filters.year) return false;
  if (filters.minRating && (item.voteAverage ?? 0) < filters.minRating) return false;
  if (filters.minVotes && (item.voteCount ?? 0) < filters.minVotes) return false;
  if (filters.originalLanguage && item.originalLanguage !== filters.originalLanguage) return false;
  if (filters.genreIds.length) {
    const requestedNames = filters.genreIds.map((id) => genreLookup.get(id)).filter(Boolean);
    if (!requestedNames.every((name) => item.genres.includes(name!))) return false;
  }
  return true;
}

export async function advancedDiscover(filters: DiscoverFilters, settings: AppSettings, pageNumber = 1): Promise<MediaItem[]> {
  const demo = filters.mediaType === 'tv' ? demoShows : demoMovies;
  if (!settings.tmdbToken) {
    const q = filters.query.trim().toLowerCase();
    return demo.filter((item) => !q || item.title.toLowerCase().includes(q));
  }

  const genres = await genreMap(filters.mediaType, settings);
  if (filters.query.trim()) {
    const path = filters.mediaType === 'tv' ? '/search/tv' : '/search/movie';
    const page = await tmdbFetch<{ results: any[] }>(path, settings, {
      query: filters.query.trim(),
      page: pageNumber,
      include_adult: !settings.safeSearch,
      ...(filters.mediaType === 'tv' && filters.year ? { first_air_date_year: filters.year } : {}),
      ...(filters.mediaType === 'movie' && filters.year ? { year: filters.year } : {}),
    });
    let items = visibleResults(page.results, settings)
      .map((item) => filters.mediaType === 'tv' ? mapTv(item, genres) : mapMovie(item, genres))
      .filter((item) => matchesBasicFilters(item, filters, genres));
    if (filters.minRuntime || filters.maxRuntime || filters.certification) {
      items = await Promise.all(items.map((item) => hydrateFilterMetadata(item, settings).catch(() => item)));
      items = items.filter((item) => {
        if (filters.minRuntime && (item.runtimeMinutes ?? 0) < filters.minRuntime) return false;
        if (filters.maxRuntime && (item.runtimeMinutes ?? Number.POSITIVE_INFINITY) > filters.maxRuntime) return false;
        if (filters.certification && (item.certification ?? '').toUpperCase() !== filters.certification.toUpperCase()) return false;
        return true;
      });
    }
    return items;
  }

  const params: Record<string, string | number | boolean> = {
    page: pageNumber,
    sort_by: filters.sortBy,
    include_adult: !settings.safeSearch,
    ...(filters.mediaType === 'movie' ? { include_video: false, region: settings.region } : {}),
  };
  if (filters.genreIds.length) params.with_genres = filters.genreIds.join(',');
  if (filters.minRating) params['vote_average.gte'] = filters.minRating;
  if (filters.minVotes) params['vote_count.gte'] = filters.minVotes;
  if (filters.minRuntime) params['with_runtime.gte'] = filters.minRuntime;
  if (filters.maxRuntime) params['with_runtime.lte'] = filters.maxRuntime;
  if (filters.originalLanguage) params.with_original_language = filters.originalLanguage;
  if (filters.year) {
    params[filters.mediaType === 'movie' ? 'primary_release_year' : 'first_air_date_year'] = filters.year;
  }
  if (filters.certification && filters.mediaType === 'movie') {
    params.certification_country = settings.region;
    params.certification = filters.certification;
  }

  const page = await tmdbFetch<{ results: any[] }>(`/discover/${filters.mediaType}`, settings, params);
  let items = visibleResults(page.results, settings).map((item) => filters.mediaType === 'tv' ? mapTv(item, genres) : mapMovie(item, genres));

  // TMDB's movie Discover endpoint can filter certification directly. TV content ratings
  // are exposed separately, so enrich the current result page only when that filter is used.
  if (filters.mediaType === 'tv' && filters.certification) {
    items = await Promise.all(items.map((item) => hydrateFilterMetadata(item, settings).catch(() => item)));
    items = items.filter((item) => (item.contentRating ?? '').toUpperCase() === filters.certification!.toUpperCase());
  }

  return items;
}

export async function getPersonalRecommendations(
  mediaType: MediaType,
  seeds: MediaItem[],
  excluded: Set<string>,
  settings: AppSettings,
): Promise<DiscoverSection | null> {
  if (!settings.tmdbToken) return null;
  const matchingSeeds = seeds
    .filter((item) => item.provider === 'tmdb' && item.mediaType === mediaType)
    .slice(0, 4);
  if (!matchingSeeds.length) return null;

  const genres = await genreMap(mediaType, settings);
  const pages = await Promise.all(matchingSeeds.map((seed) =>
    tmdbFetch<{ results: any[] }>(`/${mediaType}/${seed.providerId}/recommendations`, settings, { page: 1 })
      .catch(() => ({ results: [] })),
  ));

  const scored = new Map<number, { item: MediaItem; count: number; firstRank: number }>();
  pages.forEach((page, seedIndex) => {
    visibleResults(page.results, settings).forEach((raw, rank) => {
      const item = mediaType === 'tv' ? mapTv(raw, genres) : mapMovie(raw, genres);
      if (excluded.has(mediaKey(item))) return;
      const current = scored.get(item.providerId);
      if (current) current.count += 1;
      else scored.set(item.providerId, { item, count: 1, firstRank: rank + seedIndex * 2 });
    });
  });

  const items = [...scored.values()]
    .sort((a, b) => b.count - a.count || a.firstRank - b.firstRank || (b.item.voteAverage ?? 0) - (a.item.voteAverage ?? 0))
    .map((entry) => entry.item)
    .slice(0, 30);
  if (!items.length) return null;
  return { id: `for-you-${mediaType}`, title: 'For You', items, personalized: true };
}

export async function hydrateMedia(item: MediaItem, settings: AppSettings): Promise<MediaItem> {
  if (item.provider !== 'tmdb' || !settings.tmdbToken) return item;
  const imageLanguage = `${settings.language.split('-')[0]},null`;

  if (item.mediaType === 'movie') {
    const [details, images, providers, releaseDates] = await Promise.all([
      tmdbFetch<any>(`/movie/${item.providerId}`, settings),
      tmdbFetch<any>(`/movie/${item.providerId}/images`, settings, { include_image_language: imageLanguage }),
      tmdbFetch<any>(`/movie/${item.providerId}/watch/providers`, settings),
      tmdbFetch<any>(`/movie/${item.providerId}/release_dates`, settings),
    ]);
    const certification = movieCertification(releaseDates, settings.region);
    return {
      ...mapMovie(details),
      logoPath: chooseLogo(images, settings.language),
      certification,
      contentRating: certification,
      watchAvailability: getWatchAvailability(providers, settings.region),
    };
  }

  const [details, images, providers, contentRatings] = await Promise.all([
    tmdbFetch<any>(`/tv/${item.providerId}`, settings),
    tmdbFetch<any>(`/tv/${item.providerId}/images`, settings, { include_image_language: imageLanguage }),
    tmdbFetch<any>(`/tv/${item.providerId}/watch/providers`, settings),
    tmdbFetch<any>(`/tv/${item.providerId}/content_ratings`, settings),
  ]);
  const base = mapTv(details);
  const seasons: Season[] = await Promise.all(
    (details.seasons ?? []).map(async (season: any) => {
      const seasonDetails = await tmdbFetch<any>(`/tv/${item.providerId}/season/${season.season_number}`, settings);
      return {
        id: season.id,
        seasonNumber: season.season_number,
        name: season.name,
        airDate: season.air_date ?? null,
        posterPath: season.poster_path ?? null,
        episodes: (seasonDetails.episodes ?? []).map(mapEpisode),
      };
    }),
  );
  const rating = tvContentRating(contentRatings, settings.region);
  return {
    ...base,
    logoPath: chooseLogo(images, settings.language),
    contentRating: rating,
    certification: rating,
    watchAvailability: getWatchAvailability(providers, settings.region),
    seasons,
  };
}

export function posterUrl(path: string | null) {
  return path ? `${IMAGE_ROOT}${path}` : null;
}

export function backdropUrl(path: string | null | undefined) {
  return path ? `${BACKDROP_ROOT}${path}` : null;
}

export function logoUrl(path: string | null | undefined) {
  return path ? `${LOGO_ROOT}${path}` : null;
}

export function providerLogoUrl(path: string | null | undefined) {
  return path ? `${PROVIDER_LOGO_ROOT}${path}` : null;
}

export function episodeStillUrl(path: string | null | undefined) {
  return path ? `${EPISODE_STILL_ROOT}${path}` : null;
}
