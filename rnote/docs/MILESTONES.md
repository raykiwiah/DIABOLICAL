# RNOTE Milestones & Roadmap

RNOTE is built in production-ready milestones. Each ends with tests, docs, and a
review/refactor pass before the next begins. This is the implementation plan.

## ✅ Milestone 1 — The Foundation (this release)

The core that everything else extends.

- **Architecture** — Clean Architecture + DDD layers, dependency rule enforced by
  path aliases; single composition root.
- **Domain** — Workspace, Document (nested pages), DocumentContent value object,
  block vocabulary, domain events, `Result`-based error handling.
- **Persistence** — Dexie/IndexedDB repositories behind ports; versioned schema.
- **Search** — FlexSearch behind a port, workspace-scoped, snippet generation.
- **Editor** — Tiptap block editor: headings, lists, to-dos, quote, code,
  divider; dependency-free `/` command menu; per-page icon; autosave; live word
  count.
- **Workspace UI** — collapsible sidebar page tree (expand, inline rename, add
  subpage, move-to-trash), breadcrumb topbar, empty states.
- **Command palette** — ⌘K search + quick actions.
- **Design system** — dual-mode (Gen Z / Millennial) × light/dark tokens,
  no-flash theming, reduced-motion support, accessible primitives.
- **Onboarding** — mode + theme selection with live preview.
- **Quality** — strict TypeScript, ESLint clean, 25 passing tests, optimized
  code-split build.

## ▶ Milestone 2 — Editor depth & content model

- Block drag-and-drop reordering with a drag handle; nested block indentation.
- Slash menu upgraded to Tiptap Suggestion; inline formatting bubble menu.
- Callouts, toggles, columns, images/files (stored locally), embeds, equations.
- Markdown paste/import + export; per-page version history (event-sourced).
- Trash view with restore/permanent-delete.

## ▶ Milestone 3 — Databases

- Block databases: table, board (Kanban), gallery, calendar, timeline views.
- Properties, filters, sorts, grouping; relations, rollups; a safe formula engine.

## ▶ Milestone 4 — Life OS modules

- Journaling (incl. prayer/dream), mood/habit trackers, finance/health/fitness,
  goals, reading/movie/travel trackers — each a module over the block + database
  primitives, so they inherit sync, search and theming for free.

## ▶ Milestone 5 — Intelligence (Bring-Your-Own-AI)

- Provider-agnostic AI layer (OpenAI, Claude, Gemini, Grok, OpenRouter, local
  models) behind an `AiProvider` port — **no AI cost incurred by RNOTE**.
- AI chat over your notes (local RAG), summarize, OCR, voice notes, flashcards.

## ▶ Milestone 6 — Desktop, sync & extensibility

- Tauri desktop shell + SQLite repository adapter.
- CRDT sync engine and bring-your-own-cloud storage adapters (Drive/Dropbox/
  OneDrive/folder) with encryption at rest.
- Plugin system, Theme Studio, Widget Studio, marketplace.

## ▶ Milestone 7 — Scale & polish

- Virtualized trees/lists, workspace sharding, performance budgets.
- Full i18n, comprehensive a11y audit, E2E test suite (Playwright), telemetry
  (opt-in, local-first).

### Between every milestone

Review architecture → refactor → optimize → document → then continue.
