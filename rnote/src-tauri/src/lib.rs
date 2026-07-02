//! RNOTE desktop shell.
//!
//! Intentionally thin: it hosts the web bundle in a native window and registers
//! the SQL plugin so the frontend's `TauriSqliteDocumentRepository` can persist
//! to a real SQLite database on disk. All product logic stays in the TypeScript
//! domain/application layers — the desktop shell adds durability and native
//! packaging, nothing more.

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_sql::Builder::default().build())
        .run(tauri::generate_context!())
        .expect("error while running RNOTE");
}
