use tauri_plugin_sql::{Migration, MigrationKind};

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    let migrations = vec![
        Migration {
            version: 1,
            description: "initial local tracker schema",
            sql: include_str!("../migrations/0001_init.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 2,
            description: "add local favorites",
            sql: include_str!("../migrations/0002_favorites.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 3,
            description: "add local title ratings",
            sql: include_str!("../migrations/0003_ratings.sql"),
            kind: MigrationKind::Up,
        },
        Migration {
            version: 4,
            description: "add stopped-watching show state",
            sql: include_str!("../migrations/0004_stopped_shows.sql"),
            kind: MigrationKind::Up,
        },
    ];

    tauri::Builder::default()
        .plugin(tauri_plugin_http::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(
            tauri_plugin_sql::Builder::default()
                .add_migrations("sqlite:local_tv_tracker.db", migrations)
                .build(),
        )
        .run(tauri::generate_context!())
        .expect("error while running MyMediaBox");
}
