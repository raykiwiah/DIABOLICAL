# RNOTE Risks & Mitigations

An honest register of the significant risks in building RNOTE to serve millions,
and how the architecture addresses them.

| # | Risk | Impact | Mitigation |
|---|------|--------|------------|
| 1 | **IndexedDB storage limits / eviction** on the web can lose data. | High | Repository ports allow a durable SQLite adapter under Tauri; warn on quota pressure; export/backup + cloud-sync milestones; never treat the browser as the only home. |
| 2 | **Data model migrations** as blocks/databases evolve. | High | Versioned Dexie schema; persistence records decoupled from domain via mappers; migrations isolated in infrastructure. |
| 3 | **Editor complexity** — a block editor is where most productivity apps accrue tech debt. | High | Built on Tiptap/ProseMirror (battle-tested) rather than a bespoke contenteditable; block vocabulary centralized in the domain; the `/` menu is a thin, replaceable layer. |
| 4 | **Sync & conflict resolution** for multi-device / BYO-cloud. | High | Deferred to a dedicated milestone with CRDTs (Yjs/Automerge) layered as a repository decorator, keeping the domain oblivious. |
| 5 | **Bundle size** from the editor + motion + search. | Medium | Vendors are code-split (`react`, `editor`, `motion`, `search`); lazy-loading of heavy modules planned; performance budgets in M7. |
| 6 | **Search scale** — FlexSearch is in-memory and rebuilt on boot. | Medium | Fine for personal-scale corpora; boot reindex is incremental-ready; a persistent/worker index or SQLite FTS can replace it behind `SearchIndexPort`. |
| 7 | **BYO-AI variance** across providers (formats, limits, refusals). | Medium | A provider-agnostic `AiProvider` port normalizes differences; AI is optional and never on RNOTE's cost. |
| 8 | **Accessibility & i18n debt** if deferred too long. | Medium | A11y is a first-class M1 concern (roles, focus, keyboard); full audit + i18n scheduled in M7 before broad launch. |
| 9 | **Scope / over-engineering** given the breadth of the vision. | Medium | Strict milestones; every module reuses the block + database + sync primitives instead of bespoke stacks; no feature ships without tests + docs. |
| 10 | **Privacy expectations** — users trust RNOTE with their life. | High | Local-first by default, no account, no telemetry without explicit opt-in; encryption at rest planned for any cloud adapter. |

## Guiding stance

When a risk and a shortcut conflict, we take the risk seriously and pay the cost
now that would otherwise compound — because RNOTE is built as if it will serve
millions.
