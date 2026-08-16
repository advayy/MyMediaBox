CREATE TABLE IF NOT EXISTS library_items (
    key TEXT PRIMARY KEY NOT NULL,
    provider TEXT NOT NULL,
    provider_id INTEGER NOT NULL,
    media_type TEXT NOT NULL,
    metadata_json TEXT NOT NULL,
    added_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS watched_episodes (
    episode_key TEXT PRIMARY KEY NOT NULL,
    media_key TEXT NOT NULL,
    episode_id INTEGER NOT NULL,
    season_number INTEGER NOT NULL,
    episode_number INTEGER NOT NULL,
    watched_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS watched_episodes_media_key_idx
ON watched_episodes(media_key);

CREATE TABLE IF NOT EXISTS watched_movies (
    media_key TEXT PRIMARY KEY NOT NULL,
    watched_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY NOT NULL,
    value TEXT NOT NULL
);
