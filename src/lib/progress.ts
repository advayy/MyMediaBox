import type { AppSettings, LibraryRecord, WatchedEpisode } from '../types';
import { episodeKey } from '../types';

export function isAired(date: string | null): boolean {
  if (!date) return false;
  return date <= new Date().toISOString().slice(0, 10);
}

export function progressFor(record: LibraryRecord, watched: WatchedEpisode[], settings: AppSettings) {
  const episodes = (record.item.seasons ?? [])
    .filter((season) => settings.includeSpecialsInProgress || season.seasonNumber !== 0)
    .flatMap((season) => season.episodes)
    .filter((episode) => isAired(episode.airDate));

  const watchedKeys = new Set(watched.map((entry) => entry.episodeKey));
  const watchedCount = episodes.filter((episode) => watchedKeys.has(episodeKey(record.item, episode))).length;
  const total = episodes.length;
  return {
    watched: watchedCount,
    total,
    percent: total === 0 ? 0 : Math.round((watchedCount / total) * 100),
  };
}

export function lastWatchedAt(record: LibraryRecord, watched: WatchedEpisode[]) {
  const dates = watched
    .filter((entry) => entry.mediaKey === record.key)
    .map((entry) => entry.watchedAt)
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function latestUnwatchedAirDate(record: LibraryRecord, watched: WatchedEpisode[], settings: AppSettings) {
  const watchedKeys = new Set(
    watched.filter((entry) => entry.mediaKey === record.key).map((entry) => entry.episodeKey),
  );
  const dates = (record.item.seasons ?? [])
    .filter((season) => settings.includeSpecialsInProgress || season.seasonNumber !== 0)
    .flatMap((season) => season.episodes)
    .filter((episode) => isAired(episode.airDate) && !watchedKeys.has(episodeKey(record.item, episode)))
    .map((episode) => episode.airDate!)
    .sort();
  return dates.length ? dates[dates.length - 1] : null;
}

function timeValue(value: string | null) {
  return value ? new Date(value).getTime() : 0;
}

export function categorizeShows(
  records: LibraryRecord[],
  watched: WatchedEpisode[],
  settings: AppSettings,
  stoppedKeys: ReadonlySet<string> = new Set(),
) {
  const now = Date.now();
  const staleMs = settings.staleDays * 86400000;
  const sections = {
    current: [] as LibraryRecord[],
    upToDate: [] as LibraryRecord[],
    stale: [] as LibraryRecord[],
    notStarted: [] as LibraryRecord[],
    stopped: [] as LibraryRecord[],
  };
  const activity = new Map<string, number>();

  for (const record of records.filter((x) => x.item.mediaType === 'tv')) {
    if (stoppedKeys.has(record.key)) {
      sections.stopped.push(record);
      activity.set(record.key, timeValue(record.addedAt));
      continue;
    }

    const last = lastWatchedAt(record, watched);
    if (!last) {
      sections.notStarted.push(record);
      activity.set(record.key, timeValue(record.addedAt));
      continue;
    }

    const progress = progressFor(record, watched, settings);
    if (progress.total > 0 && progress.watched === progress.total) {
      sections.upToDate.push(record);
      activity.set(record.key, timeValue(last));
      continue;
    }

    // A newly aired, unwatched episode makes an active show relevant again even
    // when the user's last watch session was older. If it stays unwatched beyond
    // the stale threshold it naturally falls back into the stale section.
    const latestRelease = latestUnwatchedAirDate(record, watched, settings);
    const attentionAt = Math.max(timeValue(last), timeValue(latestRelease));
    activity.set(record.key, attentionAt);
    if (now - attentionAt > staleMs) sections.stale.push(record);
    else sections.current.push(record);
  }

  const newestActivityFirst = (a: LibraryRecord, b: LibraryRecord) =>
    (activity.get(b.key) ?? 0) - (activity.get(a.key) ?? 0) || a.item.title.localeCompare(b.item.title);

  sections.current.sort(newestActivityFirst);
  sections.upToDate.sort(newestActivityFirst);
  sections.stale.sort(newestActivityFirst);
  sections.notStarted.sort(newestActivityFirst);
  sections.stopped.sort(newestActivityFirst);
  return sections;
}
