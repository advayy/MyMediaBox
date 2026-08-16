CREATE TABLE IF NOT EXISTS ratings (
    media_key TEXT PRIMARY KEY NOT NULL,
    rating REAL NOT NULL CHECK (rating >= 0 AND rating <= 10),
    rated_at TEXT NOT NULL
);
