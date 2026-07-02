# ADR 0003 — Tauri desktop shell with a SQLite repository adapter

- **Status:** Accepted (shell scaffolded; ships behind the desktop build)
- **Date:** Milestone 2/6

## Context

RNOTE is local-first and must eventually run as a native desktop app with
durable, high-performance storage. IndexedDB serves the web build well, but the
desktop build wants real SQLite on disk. The architecture promised (ADR 0002)
that swapping storage would not touch domain or application code — this is where
that promise is cashed in.

## Decision

Add a **Tauri v2** desktop shell (`src-tauri/`) that hosts the exact same web
bundle in a native window, and a **`TauriSqlite*Repository`** pair that
implements the existing `DocumentRepository` / `WorkspaceRepository` ports using
`@tauri-apps/plugin-sql` (SQLite).

The composition root (`container.ts`) selects the adapter at runtime:

```
isTauri() ? SQLite (desktop) : IndexedDB (web)
```

## How the promise held

- **Zero changes** to `domain/` or `application/`. Only a new infrastructure
  adapter and one branch in the composition root.
- The domain **record mappers are reused verbatim** — the SQLite adapter maps
  rows to the same `DocumentRecord` shape the IndexedDB adapter uses.
- The SQLite schema mirrors the IndexedDB records exactly (`parent_id = ''` for
  roots, `is_archived` as `0|1`), so behaviour is identical across platforms.

## Bundle hygiene

`@tauri-apps/plugin-sql` is loaded via a **dynamic `import()`** inside the
SQLite database module. The web build code-splits it into a ~0.5 kB lazy chunk
that a browser never fetches, so desktop-only code costs the web app nothing.
Verified: the main web chunk contains no `plugin:sql` code.

## The Rust shell

`src-tauri/src/lib.rs` is intentionally thin — it registers the SQL plugin and
runs the window. All product logic stays in TypeScript. Capabilities in
`src-tauri/capabilities/default.json` grant the frontend SQL access.

## Consequences & verification boundary

- The **TypeScript adapter is fully type-checked** and the web build proves the
  code-splitting.
- **Compiling the Rust shell** requires a Rust toolchain and the platform webview
  libraries (on Linux: `libwebkit2gtk-4.1-dev`, `libgtk-3-dev`, …). This is
  standard Tauri tooling and is expected to run on a developer machine or CI with
  those system packages installed:

  ```bash
  npm run tauri:dev     # run the desktop app
  npm run tauri:build   # produce installers
  npm run tauri icon ./app-icon.png   # regenerate the icon set
  ```

## Alternatives considered

- **Rust-side repository (tauri commands)** instead of `plugin-sql` — more Rust
  code and a second mapping layer for no benefit; rejected in favour of keeping
  persistence logic in one place (TypeScript).
- **sql.js / wa-sqlite in the browser** — viable for the web build later, but
  IndexedDB is simpler and sufficient today.
