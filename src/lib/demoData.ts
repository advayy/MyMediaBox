import type { DiscoverSection, MediaItem } from '../types';

const episode = (id: number, seasonNumber: number, episodeNumber: number, name: string, daysAgo: number) => ({
  id,
  seasonNumber,
  episodeNumber,
  name,
  airDate: new Date(Date.now() - daysAgo * 86400000).toISOString().slice(0, 10),
});

export const demoShows: MediaItem[] = [
  {
    provider: 'demo',
    providerId: 101,
    mediaType: 'tv',
    title: 'Signal House',
    overview: 'A small coastal radio station starts receiving broadcasts from one week in the future.',
    posterPath: null,
    releaseDate: '2026-02-01',
    genres: ['Drama', 'Mystery'],
    status: 'Returning Series',
    seasons: [
      {
        id: 1011,
        seasonNumber: 1,
        name: 'Season 1',
        airDate: '2026-02-01',
        episodes: [
          episode(10101, 1, 1, 'Dead Air', 120),
          episode(10102, 1, 2, 'The Weather Report', 113),
          episode(10103, 1, 3, 'Seven Days Early', 106),
          episode(10104, 1, 4, 'A Voice in Static', 99),
          episode(10105, 1, 5, 'Low Tide', 92),
          episode(10106, 1, 6, 'Tomorrow Night', 85),
        ],
      },
    ],
  },
  {
    provider: 'demo',
    providerId: 102,
    mediaType: 'tv',
    title: 'Northbound',
    overview: 'Five strangers share a train car through an endless winter.',
    posterPath: null,
    releaseDate: '2025-10-14',
    genres: ['Drama', 'Thriller'],
    status: 'Returning Series',
    seasons: [
      {
        id: 1021,
        seasonNumber: 1,
        name: 'Season 1',
        airDate: '2025-10-14',
        episodes: Array.from({ length: 8 }, (_, index) =>
          episode(10200 + index + 1, 1, index + 1, `Car ${index + 1}`, 300 - index * 7),
        ),
      },
      {
        id: 1022,
        seasonNumber: 2,
        name: 'Season 2',
        airDate: '2026-06-02',
        episodes: Array.from({ length: 5 }, (_, index) =>
          episode(10220 + index + 1, 2, index + 1, `White Mile ${index + 1}`, 70 - index * 7),
        ),
      },
    ],
  },
  {
    provider: 'demo',
    providerId: 103,
    mediaType: 'tv',
    title: 'Patch Notes',
    overview: 'A software studio discovers that each release changes the real world in small, alarming ways.',
    posterPath: null,
    releaseDate: '2026-04-22',
    genres: ['Comedy', 'Science Fiction'],
    status: 'Returning Series',
    seasons: [
      {
        id: 1031,
        seasonNumber: 1,
        name: 'Season 1',
        airDate: '2026-04-22',
        episodes: Array.from({ length: 7 }, (_, index) =>
          episode(10300 + index + 1, 1, index + 1, `v1.${index + 1}`, 100 - index * 7),
        ),
      },
      {
        id: 1030,
        seasonNumber: 0,
        name: 'Specials',
        airDate: '2026-05-01',
        episodes: [episode(10399, 0, 1, 'Hotfix', 90)],
      },
    ],
  },
  {
    provider: 'demo',
    providerId: 104,
    mediaType: 'tv',
    title: 'The Last Checkout',
    overview: 'Night staff at a fading hotel catalogue the impossible guests who never appear on camera.',
    posterPath: null,
    releaseDate: '2024-09-09',
    genres: ['Horror', 'Mystery'],
    status: 'Ended',
    seasons: [
      {
        id: 1041,
        seasonNumber: 1,
        name: 'Season 1',
        airDate: '2024-09-09',
        episodes: Array.from({ length: 6 }, (_, index) =>
          episode(10400 + index + 1, 1, index + 1, `Room ${201 + index}`, 600 - index * 7),
        ),
      },
    ],
  },
  {
    provider: 'demo',
    providerId: 105,
    mediaType: 'tv',
    title: 'Small Gods',
    overview: 'Ordinary household objects develop tiny, inconvenient miracles.',
    posterPath: null,
    releaseDate: '2026-07-01',
    genres: ['Comedy', 'Fantasy'],
    status: 'Returning Series',
    seasons: [
      {
        id: 1051,
        seasonNumber: 1,
        name: 'Season 1',
        airDate: '2026-07-01',
        episodes: Array.from({ length: 5 }, (_, index) =>
          episode(10500 + index + 1, 1, index + 1, `Minor Miracle ${index + 1}`, 40 - index * 7),
        ),
      },
    ],
  },
];

export const demoMovies: MediaItem[] = [
  {
    provider: 'demo',
    providerId: 201,
    mediaType: 'movie',
    title: 'Sea Level',
    overview: 'A surveyor returns to an island that should have disappeared years ago.',
    posterPath: null,
    releaseDate: '2026-03-10',
    genres: ['Drama'],
  },
  {
    provider: 'demo',
    providerId: 202,
    mediaType: 'movie',
    title: 'Soft Reset',
    overview: 'A city wakes up every Monday with one memory missing.',
    posterPath: null,
    releaseDate: '2026-05-08',
    genres: ['Science Fiction'],
  },
  {
    provider: 'demo',
    providerId: 203,
    mediaType: 'movie',
    title: 'The Spare Key',
    overview: 'A comedy about four tenants who all secretly copy the same key.',
    posterPath: null,
    releaseDate: '2025-11-20',
    genres: ['Comedy'],
  },
  {
    provider: 'demo',
    providerId: 204,
    mediaType: 'movie',
    title: 'Long Exposure',
    overview: 'A photographer finds a stranger appearing closer in every undeveloped frame.',
    posterPath: null,
    releaseDate: '2026-01-18',
    genres: ['Horror'],
  },
];

export const demoSections: DiscoverSection[] = [
  { id: 'demo-popular-shows', title: 'Popular Shows', items: demoShows },
  { id: 'demo-popular-movies', title: 'Popular Movies', items: demoMovies },
  { id: 'demo-drama', title: 'Drama', items: [...demoShows.filter((x) => x.genres.includes('Drama')), ...demoMovies.filter((x) => x.genres.includes('Drama'))] },
  { id: 'demo-comedy', title: 'Comedy', items: [...demoShows.filter((x) => x.genres.includes('Comedy')), ...demoMovies.filter((x) => x.genres.includes('Comedy'))] },
  { id: 'demo-scifi', title: 'Science Fiction', items: [...demoShows.filter((x) => x.genres.includes('Science Fiction')), ...demoMovies.filter((x) => x.genres.includes('Science Fiction'))] },
];
