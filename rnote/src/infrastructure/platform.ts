/**
 * Runtime platform detection. Tauri v2 injects `__TAURI_INTERNALS__` into the
 * webview's window; its absence means we're a plain browser tab. This is the one
 * switch that decides SQLite (desktop) vs IndexedDB (web) in the composition root.
 */
export function isTauri(): boolean {
  return typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window;
}
