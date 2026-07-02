# ADR 0002 — Local-first persistence behind repository ports

- **Status:** Accepted
- **Date:** Milestone 1

## Context

RNOTE must be offline-first and give users a choice of storage (local, Google
Drive, Dropbox, OneDrive, external folder) with no proprietary cloud. Milestone 1
needs working persistence today, and the architecture must let us add SQLite
(via Tauri) and cloud sync later without disturbing the domain or application.

## Decision

- Persist through **repository ports** (`DocumentRepository`,
  `WorkspaceRepository`) defined in the application layer.
- Implement those ports in Milestone 1 with **Dexie over IndexedDB**.
- Index full-text search behind a **`SearchIndexPort`**, implemented with
  **FlexSearch** (in-memory, rebuilt from persistence on boot).
- Wire concrete implementations only in `composition/container.ts`.

## Rationale

- **IndexedDB** is the durable, offline, structured store available in every
  browser and inside Tauri's webview — the right default for local-first.
- **Dexie** gives a typed, ergonomic API and compound indexes for the two hot
  queries (children-of-a-page, active-documents-of-a-workspace).
- Ports mean the domain/application never learn where data lives. The Tauri
  build can supply a `SqliteDocumentRepository`; a sync milestone can decorate a
  repository with a `CloudSyncRepository` — all without touching use cases.

## Consequences

- Persistence records are **decoupled** from domain entities (mappers translate).
  Storage constraints (no `null` in indexes → `parentId=''`; booleans as `0|1`)
  stay in infrastructure.
- Search is derived state: it is rebuilt on boot and kept consistent by the
  `DocumentService`, so it can never drift from the source of truth.
- Migrations are versioned in `RnoteDatabase` (Dexie `version().stores()`).

## Future direction

1. **SQLite adapter** (Tauri) implementing the same ports; choose per-platform in
   `container.ts`.
2. **CRDT sync layer** (e.g. Yjs/Automerge) for multi-device and the
   bring-your-own-cloud adapters, layered as a repository decorator so the
   domain remains oblivious.
3. **Encryption at rest** for cloud adapters (privacy-first).
