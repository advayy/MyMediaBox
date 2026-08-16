import type {
  AppSettings,
  BackupSnapshot,
  Favorite,
  LibraryRecord,
  MediaItem,
  MediaRating,
  StorageMode,
  StoppedShow,
  WatchedEpisode,
  WatchedMovie,
} from '../types';
import { APP_VERSION, DEFAULT_SETTINGS, mediaKey } from '../types';

export interface StorageAdapter {
  mode: StorageMode;
  getLibrary(): Promise<LibraryRecord[]>;
  putLibraryItem(item: MediaItem): Promise<LibraryRecord>;
  removeLibraryItem(key: string): Promise<void>;
  getWatchedEpisodes(): Promise<WatchedEpisode[]>;
  setEpisodeWatched(item: MediaItem, episode: WatchedEpisode, watched: boolean): Promise<void>;
  setEpisodesWatched(item: MediaItem, episodes: WatchedEpisode[], watched: boolean): Promise<void>;
  getWatchedMovies(): Promise<WatchedMovie[]>;
  setMovieWatched(item: MediaItem, watched: boolean): Promise<void>;
  getFavorites(): Promise<Favorite[]>;
  setFavorite(item: MediaItem, favorite: boolean): Promise<void>;
  getRatings(): Promise<MediaRating[]>;
  setRating(item: MediaItem, rating: number | null): Promise<void>;
  getStoppedShows(): Promise<StoppedShow[]>;
  setShowStopped(item: MediaItem, stopped: boolean): Promise<void>;
  getSettings(): Promise<AppSettings>;
  saveSettings(settings: AppSettings): Promise<void>;
  clearLibrary(): Promise<void>;
  exportSnapshot(): Promise<BackupSnapshot>;
  restoreSnapshot(snapshot: BackupSnapshot): Promise<void>;
}

// Compatibility contract: do not rename this key without migrating existing browser data.
const BROWSER_KEY = 'local-tv-tracker-v1';

type BrowserSnapshot = {
  library: LibraryRecord[];
  watchedEpisodes: WatchedEpisode[];
  watchedMovies: WatchedMovie[];
  favorites: Favorite[];
  ratings: MediaRating[];
  stoppedShows: StoppedShow[];
  settings: AppSettings;
};

function initialSnapshot(): BrowserSnapshot {
  return {
    library: [],
    watchedEpisodes: [],
    watchedMovies: [],
    favorites: [],
    ratings: [],
    stoppedShows: [],
    settings: DEFAULT_SETTINGS,
  };
}

function readBrowserSnapshot(): BrowserSnapshot {
  const raw = localStorage.getItem(BROWSER_KEY);
  if (!raw) return initialSnapshot();
  try {
    const parsed = JSON.parse(raw) as Partial<BrowserSnapshot>;
    return {
      library: parsed.library ?? [],
      watchedEpisodes: parsed.watchedEpisodes ?? [],
      watchedMovies: parsed.watchedMovies ?? [],
      favorites: parsed.favorites ?? [],
      ratings: parsed.ratings ?? [],
      stoppedShows: parsed.stoppedShows ?? [],
      settings: { ...DEFAULT_SETTINGS, ...(parsed.settings ?? {}) },
    };
  } catch {
    return initialSnapshot();
  }
}

function writeBrowserSnapshot(snapshot: BrowserSnapshot) {
  localStorage.setItem(BROWSER_KEY, JSON.stringify(snapshot));
}

class BrowserStorage implements StorageAdapter {
  mode: StorageMode = 'browser';

  async getLibrary() {
    return readBrowserSnapshot().library;
  }

  async putLibraryItem(item: MediaItem) {
    const snapshot = readBrowserSnapshot();
    const key = mediaKey(item);
    const previous = snapshot.library.find((record) => record.key === key);
    const now = new Date().toISOString();
    const record: LibraryRecord = {
      key,
      item,
      addedAt: previous?.addedAt ?? now,
      updatedAt: now,
    };
    snapshot.library = [record, ...snapshot.library.filter((entry) => entry.key !== key)];
    writeBrowserSnapshot(snapshot);
    return record;
  }

  async removeLibraryItem(key: string) {
    const snapshot = readBrowserSnapshot();
    snapshot.library = snapshot.library.filter((record) => record.key !== key);
    snapshot.favorites = snapshot.favorites.filter((favorite) => favorite.mediaKey !== key);
    snapshot.stoppedShows = snapshot.stoppedShows.filter((entry) => entry.mediaKey !== key);
    writeBrowserSnapshot(snapshot);
  }

  async getWatchedEpisodes() {
    return readBrowserSnapshot().watchedEpisodes;
  }

  async setEpisodeWatched(item: MediaItem, watchedEpisode: WatchedEpisode, watched: boolean) {
    await this.setEpisodesWatched(item, [watchedEpisode], watched);
  }

  async setEpisodesWatched(_item: MediaItem, episodes: WatchedEpisode[], watched: boolean) {
    if (!episodes.length) return;
    const snapshot = readBrowserSnapshot();
    const keys = new Set(episodes.map((entry) => entry.episodeKey));
    snapshot.watchedEpisodes = snapshot.watchedEpisodes.filter((entry) => !keys.has(entry.episodeKey));
    if (watched) snapshot.watchedEpisodes.push(...episodes);
    writeBrowserSnapshot(snapshot);
  }

  async getWatchedMovies() {
    return readBrowserSnapshot().watchedMovies;
  }

  async setMovieWatched(item: MediaItem, watched: boolean) {
    const snapshot = readBrowserSnapshot();
    const key = mediaKey(item);
    snapshot.watchedMovies = snapshot.watchedMovies.filter((entry) => entry.mediaKey !== key);
    if (watched) snapshot.watchedMovies.push({ mediaKey: key, watchedAt: new Date().toISOString() });
    writeBrowserSnapshot(snapshot);
  }

  async getFavorites() {
    return readBrowserSnapshot().favorites;
  }

  async setFavorite(item: MediaItem, favorite: boolean) {
    const snapshot = readBrowserSnapshot();
    const key = mediaKey(item);
    snapshot.favorites = snapshot.favorites.filter((entry) => entry.mediaKey !== key);
    if (favorite) snapshot.favorites.push({ mediaKey: key, favoritedAt: new Date().toISOString() });
    writeBrowserSnapshot(snapshot);
  }

  async getRatings() {
    return readBrowserSnapshot().ratings;
  }

  async setRating(item: MediaItem, rating: number | null) {
    const snapshot = readBrowserSnapshot();
    const key = mediaKey(item);
    snapshot.ratings = snapshot.ratings.filter((entry) => entry.mediaKey !== key);
    if (rating !== null) snapshot.ratings.push({ mediaKey: key, rating, ratedAt: new Date().toISOString() });
    writeBrowserSnapshot(snapshot);
  }

  async getStoppedShows() {
    return readBrowserSnapshot().stoppedShows;
  }

  async setShowStopped(item: MediaItem, stopped: boolean) {
    const snapshot = readBrowserSnapshot();
    const key = mediaKey(item);
    snapshot.stoppedShows = snapshot.stoppedShows.filter((entry) => entry.mediaKey !== key);
    if (stopped) snapshot.stoppedShows.push({ mediaKey: key, stoppedAt: new Date().toISOString() });
    writeBrowserSnapshot(snapshot);
  }

  async getSettings() {
    return readBrowserSnapshot().settings;
  }

  async saveSettings(settings: AppSettings) {
    const snapshot = readBrowserSnapshot();
    snapshot.settings = settings;
    writeBrowserSnapshot(snapshot);
  }

  async clearLibrary() {
    const snapshot = readBrowserSnapshot();
    snapshot.library = [];
    snapshot.favorites = [];
    snapshot.stoppedShows = [];
    writeBrowserSnapshot(snapshot);
  }

  async exportSnapshot(): Promise<BackupSnapshot> {
    const snapshot = readBrowserSnapshot();
    const { tmdbToken: _token, ...safeSettings } = snapshot.settings;
    return {
      schemaVersion: 3,
      app: 'MyMediaBox',
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      library: snapshot.library,
      watchedEpisodes: snapshot.watchedEpisodes,
      watchedMovies: snapshot.watchedMovies,
      favorites: snapshot.favorites,
      ratings: snapshot.ratings,
      stoppedShows: snapshot.stoppedShows,
      settings: safeSettings,
    };
  }

  async restoreSnapshot(backup: BackupSnapshot) {
    const current = readBrowserSnapshot();
    writeBrowserSnapshot({
      library: backup.library ?? [],
      watchedEpisodes: backup.watchedEpisodes ?? [],
      watchedMovies: backup.watchedMovies ?? [],
      favorites: backup.favorites ?? [],
      ratings: backup.ratings ?? [],
      stoppedShows: backup.stoppedShows ?? [],
      settings: { ...DEFAULT_SETTINGS, ...backup.settings, tmdbToken: current.settings.tmdbToken },
    });
  }
}

class SqliteStorage implements StorageAdapter {
  mode: StorageMode = 'sqlite';
  private dbPromise: Promise<import('@tauri-apps/plugin-sql').default>;

  constructor() {
    this.dbPromise = import('@tauri-apps/plugin-sql').then(({ default: Database }) =>
      // Compatibility contract: keep this filename stable unless an explicit data migration moves it.
      Database.load('sqlite:local_tv_tracker.db'),
    );
  }

  private async db() {
    return this.dbPromise;
  }

  async getLibrary() {
    const db = await this.db();
    const rows = await db.select<Array<{ key: string; metadata_json: string; added_at: string; updated_at: string }>>(
      'SELECT key, metadata_json, added_at, updated_at FROM library_items ORDER BY added_at DESC',
    );
    return rows.map((row) => ({
      key: row.key,
      item: JSON.parse(row.metadata_json) as MediaItem,
      addedAt: row.added_at,
      updatedAt: row.updated_at,
    }));
  }

  async putLibraryItem(item: MediaItem) {
    const db = await this.db();
    const key = mediaKey(item);
    const now = new Date().toISOString();
    const existing = await db.select<Array<{ added_at: string }>>('SELECT added_at FROM library_items WHERE key = $1', [key]);
    const addedAt = existing[0]?.added_at ?? now;
    await db.execute(
      `INSERT INTO library_items (key, provider, provider_id, media_type, metadata_json, added_at, updated_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT(key) DO UPDATE SET metadata_json = excluded.metadata_json, updated_at = excluded.updated_at`,
      [key, item.provider, item.providerId, item.mediaType, JSON.stringify(item), addedAt, now],
    );
    return { key, item, addedAt, updatedAt: now };
  }

  async removeLibraryItem(key: string) {
    const db = await this.db();
    await db.execute('DELETE FROM library_items WHERE key = $1', [key]);
    await db.execute('DELETE FROM favorites WHERE media_key = $1', [key]);
    await db.execute('DELETE FROM stopped_shows WHERE media_key = $1', [key]);
  }

  async getWatchedEpisodes() {
    const db = await this.db();
    const rows = await db.select<Array<{
      episode_key: string;
      media_key: string;
      episode_id: number;
      season_number: number;
      episode_number: number;
      watched_at: string;
    }>>('SELECT * FROM watched_episodes');
    return rows.map((row) => ({
      episodeKey: row.episode_key,
      mediaKey: row.media_key,
      episodeId: row.episode_id,
      seasonNumber: row.season_number,
      episodeNumber: row.episode_number,
      watchedAt: row.watched_at,
    }));
  }

  async setEpisodeWatched(item: MediaItem, watchedEpisode: WatchedEpisode, watched: boolean) {
    await this.setEpisodesWatched(item, [watchedEpisode], watched);
  }

  async setEpisodesWatched(item: MediaItem, episodes: WatchedEpisode[], watched: boolean) {
    if (!episodes.length) return;
    const db = await this.db();

    // tauri-plugin-sql uses a connection pool. Sending BEGIN / later writes /
    // COMMIT as separate execute() calls can put those statements on different
    // pooled connections, which makes even a one-episode toggle fail. Keep each
    // chunk as one atomic SQL statement instead. This is still fast for catch-up
    // operations and, importantly, reliable for normal episode clicks.
    if (!watched) {
      for (let offset = 0; offset < episodes.length; offset += 300) {
        const chunk = episodes.slice(offset, offset + 300);
        const placeholders = chunk.map((_, index) => `$${index + 1}`).join(', ');
        await db.execute(
          `DELETE FROM watched_episodes WHERE episode_key IN (${placeholders})`,
          chunk.map((entry) => entry.episodeKey),
        );
      }
      return;
    }

    // One database/IPC call per chunk instead of one call per episode. Six
    // values per row keeps 100-row chunks below SQLite's conservative
    // 999-bound-variable limit.
    for (let offset = 0; offset < episodes.length; offset += 100) {
      const chunk = episodes.slice(offset, offset + 100);
      const params: Array<string | number> = [];
      const values = chunk.map((entry, rowIndex) => {
        const base = rowIndex * 6;
        params.push(
          entry.episodeKey,
          mediaKey(item),
          entry.episodeId,
          entry.seasonNumber,
          entry.episodeNumber,
          entry.watchedAt,
        );
        return `($${base + 1}, $${base + 2}, $${base + 3}, $${base + 4}, $${base + 5}, $${base + 6})`;
      });
      await db.execute(
        `INSERT INTO watched_episodes (episode_key, media_key, episode_id, season_number, episode_number, watched_at)
         VALUES ${values.join(', ')}
         ON CONFLICT(episode_key) DO UPDATE SET watched_at = excluded.watched_at`,
        params,
      );
    }
  }

  async getWatchedMovies() {
    const db = await this.db();
    const rows = await db.select<Array<{ media_key: string; watched_at: string }>>('SELECT * FROM watched_movies');
    return rows.map((row) => ({ mediaKey: row.media_key, watchedAt: row.watched_at }));
  }

  async setMovieWatched(item: MediaItem, watched: boolean) {
    const db = await this.db();
    const key = mediaKey(item);
    if (!watched) {
      await db.execute('DELETE FROM watched_movies WHERE media_key = $1', [key]);
      return;
    }
    await db.execute(
      `INSERT INTO watched_movies (media_key, watched_at) VALUES ($1, $2)
       ON CONFLICT(media_key) DO UPDATE SET watched_at = excluded.watched_at`,
      [key, new Date().toISOString()],
    );
  }

  async getFavorites() {
    const db = await this.db();
    const rows = await db.select<Array<{ media_key: string; favorited_at: string }>>(
      'SELECT media_key, favorited_at FROM favorites ORDER BY favorited_at DESC',
    );
    return rows.map((row) => ({ mediaKey: row.media_key, favoritedAt: row.favorited_at }));
  }

  async setFavorite(item: MediaItem, favorite: boolean) {
    const db = await this.db();
    const key = mediaKey(item);
    if (!favorite) {
      await db.execute('DELETE FROM favorites WHERE media_key = $1', [key]);
      return;
    }
    await db.execute(
      `INSERT INTO favorites (media_key, favorited_at) VALUES ($1, $2)
       ON CONFLICT(media_key) DO UPDATE SET favorited_at = excluded.favorited_at`,
      [key, new Date().toISOString()],
    );
  }

  async getRatings() {
    const db = await this.db();
    const rows = await db.select<Array<{ media_key: string; rating: number; rated_at: string }>>(
      'SELECT media_key, rating, rated_at FROM ratings ORDER BY rated_at DESC',
    );
    return rows.map((row) => ({ mediaKey: row.media_key, rating: Number(row.rating), ratedAt: row.rated_at }));
  }

  async setRating(item: MediaItem, rating: number | null) {
    const db = await this.db();
    const key = mediaKey(item);
    if (rating === null) {
      await db.execute('DELETE FROM ratings WHERE media_key = $1', [key]);
      return;
    }
    await db.execute(
      `INSERT INTO ratings (media_key, rating, rated_at) VALUES ($1, $2, $3)
       ON CONFLICT(media_key) DO UPDATE SET rating = excluded.rating, rated_at = excluded.rated_at`,
      [key, rating, new Date().toISOString()],
    );
  }

  async getStoppedShows() {
    const db = await this.db();
    const rows = await db.select<Array<{ media_key: string; stopped_at: string }>>(
      'SELECT media_key, stopped_at FROM stopped_shows ORDER BY stopped_at DESC',
    );
    return rows.map((row) => ({ mediaKey: row.media_key, stoppedAt: row.stopped_at }));
  }

  async setShowStopped(item: MediaItem, stopped: boolean) {
    const db = await this.db();
    const key = mediaKey(item);
    if (!stopped) {
      await db.execute('DELETE FROM stopped_shows WHERE media_key = $1', [key]);
      return;
    }
    await db.execute(
      `INSERT INTO stopped_shows (media_key, stopped_at) VALUES ($1, $2)
       ON CONFLICT(media_key) DO UPDATE SET stopped_at = excluded.stopped_at`,
      [key, new Date().toISOString()],
    );
  }

  async getSettings() {
    const db = await this.db();
    const rows = await db.select<Array<{ key: string; value: string }>>('SELECT key, value FROM settings');
    const map = Object.fromEntries(rows.map((row) => [row.key, row.value]));
    return {
      staleDays: Number(map.staleDays ?? DEFAULT_SETTINGS.staleDays),
      includeSpecialsInProgress: (map.includeSpecialsInProgress ?? String(DEFAULT_SETTINGS.includeSpecialsInProgress)) === 'true',
      promptForRatingAfterWatch: (map.promptForRatingAfterWatch ?? String(DEFAULT_SETTINGS.promptForRatingAfterWatch)) === 'true',
      safeSearch: (map.safeSearch ?? String(DEFAULT_SETTINGS.safeSearch)) === 'true',
      skin: map.skin === 'modern' ? 'modern' : DEFAULT_SETTINGS.skin,
      pixelNavIcons: (map.pixelNavIcons ?? String(DEFAULT_SETTINGS.pixelNavIcons)) === 'true',
      retroAccent: map.retroAccent ?? DEFAULT_SETTINGS.retroAccent,
      retroDesktop: map.retroDesktop ?? DEFAULT_SETTINGS.retroDesktop,
      retroSurface: map.retroSurface ?? DEFAULT_SETTINGS.retroSurface,
      completionColor: map.completionColor ?? DEFAULT_SETTINGS.completionColor,
      incompleteColor: map.incompleteColor ?? DEFAULT_SETTINGS.incompleteColor,
      discoverTabColor: map.discoverTabColor ?? DEFAULT_SETTINGS.discoverTabColor,
      moviesTabColor: map.moviesTabColor ?? DEFAULT_SETTINGS.moviesTabColor,
      showsTabColor: map.showsTabColor ?? DEFAULT_SETTINGS.showsTabColor,
      upcomingTabColor: map.upcomingTabColor ?? DEFAULT_SETTINGS.upcomingTabColor,
      historyTabColor: map.historyTabColor ?? DEFAULT_SETTINGS.historyTabColor,
      statsTabColor: map.statsTabColor ?? DEFAULT_SETTINGS.statsTabColor,
      upToDateTagColor: map.upToDateTagColor ?? DEFAULT_SETTINGS.upToDateTagColor,
      completedTagColor: map.completedTagColor ?? DEFAULT_SETTINGS.completedTagColor,
      didNotFinishTagColor: map.didNotFinishTagColor ?? DEFAULT_SETTINGS.didNotFinishTagColor,
      ratingColor: map.ratingColor ?? DEFAULT_SETTINGS.ratingColor,
      favoriteColor: map.favoriteColor ?? DEFAULT_SETTINGS.favoriteColor,
      customSkinEnabled: (map.customSkinEnabled ?? String(DEFAULT_SETTINGS.customSkinEnabled)) === 'true',
      customSkinCss: map.customSkinCss ?? DEFAULT_SETTINGS.customSkinCss,
      tmdbToken: map.tmdbToken ?? DEFAULT_SETTINGS.tmdbToken,
      language: map.language ?? DEFAULT_SETTINGS.language,
      region: map.region ?? DEFAULT_SETTINGS.region,
    };
  }

  async saveSettings(settings: AppSettings) {
    const db = await this.db();
    for (const [key, value] of Object.entries(settings)) {
      await db.execute(
        `INSERT INTO settings (key, value) VALUES ($1, $2)
         ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
        [key, String(value)],
      );
    }
  }

  async clearLibrary() {
    const db = await this.db();
    await db.execute('DELETE FROM library_items');
    await db.execute('DELETE FROM favorites');
    await db.execute('DELETE FROM stopped_shows');
  }

  async exportSnapshot(): Promise<BackupSnapshot> {
    const [library, watchedEpisodes, watchedMovies, favorites, ratings, stoppedShows, settings] = await Promise.all([
      this.getLibrary(),
      this.getWatchedEpisodes(),
      this.getWatchedMovies(),
      this.getFavorites(),
      this.getRatings(),
      this.getStoppedShows(),
      this.getSettings(),
    ]);
    const { tmdbToken: _token, ...safeSettings } = settings;
    return {
      schemaVersion: 3,
      app: 'MyMediaBox',
      appVersion: APP_VERSION,
      exportedAt: new Date().toISOString(),
      library,
      watchedEpisodes,
      watchedMovies,
      favorites,
      ratings,
      stoppedShows,
      settings: safeSettings,
    };
  }

  async restoreSnapshot(backup: BackupSnapshot) {
    const db = await this.db();
    const currentSettings = await this.getSettings();
    await db.execute('BEGIN TRANSACTION');
    try {
      await db.execute('DELETE FROM stopped_shows');
      await db.execute('DELETE FROM ratings');
      await db.execute('DELETE FROM favorites');
      await db.execute('DELETE FROM watched_episodes');
      await db.execute('DELETE FROM watched_movies');
      await db.execute('DELETE FROM library_items');

      for (const record of backup.library ?? []) {
        await db.execute(
          `INSERT INTO library_items (key, provider, provider_id, media_type, metadata_json, added_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, $6, $7)`,
          [record.key, record.item.provider, record.item.providerId, record.item.mediaType, JSON.stringify(record.item), record.addedAt, record.updatedAt],
        );
      }
      for (const entry of backup.watchedEpisodes ?? []) {
        await db.execute(
          `INSERT INTO watched_episodes (episode_key, media_key, episode_id, season_number, episode_number, watched_at)
           VALUES ($1, $2, $3, $4, $5, $6)`,
          [entry.episodeKey, entry.mediaKey, entry.episodeId, entry.seasonNumber, entry.episodeNumber, entry.watchedAt],
        );
      }
      for (const entry of backup.watchedMovies ?? []) {
        await db.execute('INSERT INTO watched_movies (media_key, watched_at) VALUES ($1, $2)', [entry.mediaKey, entry.watchedAt]);
      }
      for (const entry of backup.favorites ?? []) {
        await db.execute('INSERT INTO favorites (media_key, favorited_at) VALUES ($1, $2)', [entry.mediaKey, entry.favoritedAt]);
      }
      for (const entry of backup.ratings ?? []) {
        await db.execute('INSERT INTO ratings (media_key, rating, rated_at) VALUES ($1, $2, $3)', [entry.mediaKey, entry.rating, entry.ratedAt]);
      }
      for (const entry of backup.stoppedShows ?? []) {
        await db.execute('INSERT INTO stopped_shows (media_key, stopped_at) VALUES ($1, $2)', [entry.mediaKey, entry.stoppedAt]);
      }

      const restoredSettings: AppSettings = {
        ...DEFAULT_SETTINGS,
        ...backup.settings,
        tmdbToken: currentSettings.tmdbToken,
      };
      for (const [key, value] of Object.entries(restoredSettings)) {
        await db.execute(
          `INSERT INTO settings (key, value) VALUES ($1, $2)
           ON CONFLICT(key) DO UPDATE SET value = excluded.value`,
          [key, String(value)],
        );
      }
      await db.execute('COMMIT');
    } catch (error) {
      await db.execute('ROLLBACK');
      throw error;
    }
  }
}

export function createStorage(): StorageAdapter {
  const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
  return isTauri ? new SqliteStorage() : new BrowserStorage();
}
