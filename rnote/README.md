<div align="center">

# RNOTE

**A beautiful, intelligent, offline-first Personal Life Operating System.**

Local-first · Privacy-first · AI-optional · Zero vendor lock-in

</div>

---

RNOTE is not a Notion clone. It borrows the best ideas from Notion, Apple Notes,
Obsidian, Arc, Linear and Duolingo, and fuses them into a single, private home
for your notes, tasks and life — one that runs entirely on your device.

This repository contains **Milestone 1: The Foundation** — a production-ready
core: a block editor, a local-first workspace, full-text search, a command
palette, and the dual-mode (Gen Z / Millennial) design system. It is built to
scale to the full product roadmap without rewrites.

> The unrelated `../index.html` (project “BUTCHER”) is a separate artifact in
> this repo and is intentionally left untouched. RNOTE lives entirely in `rnote/`.

## Highlights

- **Block editor** — Tiptap/ProseMirror with headings, lists, to-dos, quotes,
  code, dividers and a dependency-free **`/` command menu**.
- **Local-first** — every keystroke is saved to **IndexedDB**; no account, no
  network, no cloud required. Reload and your work is exactly where you left it.
- **Nested pages** — an infinitely nestable page tree with drag-safe moves
  (cycle-detected), inline rename, and subtree archive.
- **Instant search** — client-side full-text search (FlexSearch) with a
  **⌘K command palette** for navigation and quick actions.
- **Two personalities, one product** — switch between **Millennial** (calm,
  minimal) and **Gen Z** (vibrant, animated) modes. Only presentation changes;
  functionality is identical.
- **Dark mode, accessible, responsive** — system-aware theming with no flash,
  visible focus rings, keyboard-first flows, and a layout that adapts to mobile.

## Quickstart

```bash
cd rnote
npm install
npm run dev      # http://localhost:1420
```

### Scripts

| Script              | Purpose                                             |
| ------------------- | --------------------------------------------------- |
| `npm run dev`       | Start the Vite dev server with HMR                  |
| `npm run build`     | Type-check and produce an optimized production build |
| `npm run preview`   | Preview the production build locally                |
| `npm run test`      | Run the unit/integration test suite (Vitest)        |
| `npm run typecheck` | Strict TypeScript type-check, no emit               |
| `npm run lint`      | Lint with ESLint                                    |

## Tech stack

React · TypeScript (strict) · Vite · Tailwind CSS · Tiptap/ProseMirror ·
Zustand · Dexie (IndexedDB) · FlexSearch · Framer Motion · Vitest.

> **Why Vite, not Next.js?** RNOTE is a local-first app destined for a Tauri
> desktop shell, where server rendering is dead weight. Vite is Tauri’s
> canonical pairing. See [`docs/adr/0001-vite-over-nextjs.md`](docs/adr/0001-vite-over-nextjs.md).

## Architecture at a glance

RNOTE follows **Clean Architecture** and **Domain-Driven Design**. Dependencies
point inward only — the domain knows nothing about React, Dexie or Tiptap.

```
presentation ─▶ application ─▶ domain ◀─ infrastructure
     (React)     (use cases)    (model)     (IndexedDB, FlexSearch)
                         ▲                         │
                         └──── ports (interfaces) ─┘
                     wired once in composition/container.ts
```

Full write-up: [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

## Project structure

```
rnote/
├── src/
│   ├── domain/            # Pure business logic (no framework imports)
│   │   ├── shared/        # Id, Result, Entity, AggregateRoot, Clock
│   │   ├── blocks/        # Block vocabulary + rich-content helpers
│   │   ├── documents/     # Document aggregate, content value object, events
│   │   └── workspace/     # Workspace aggregate
│   ├── application/       # Use cases + ports (interfaces)
│   │   ├── ports/         # DocumentRepository, WorkspaceRepository, SearchIndex
│   │   ├── documents/     # DocumentService, mappers
│   │   └── workspace/     # WorkspaceService
│   ├── infrastructure/    # Adapters implementing the ports
│   │   ├── persistence/   # Dexie (IndexedDB) database, repositories, records
│   │   ├── search/        # FlexSearch index
│   │   └── time/          # SystemClock
│   ├── composition/       # container.ts — the only place wiring is allowed
│   └── presentation/      # React UI
│       ├── theme/         # Design tokens (CSS), globals, editor styles
│       ├── components/    # Reusable primitives (Button, Kbd, …)
│       ├── state/         # Zustand stores (preferences, workspace)
│       ├── editor/        # Block editor + slash menu + icon picker
│       ├── sidebar/ topbar/ onboarding/ command-palette/ app/
│       └── hooks/ lib/
├── tests/                 # Vitest unit + integration tests
└── docs/                  # Architecture, ADRs, roadmap, testing, risks
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Milestones & roadmap](docs/MILESTONES.md)
- [Testing strategy](docs/TESTING.md)
- [Risks & mitigations](docs/RISKS.md)
- [ADR 0001 — Vite over Next.js](docs/adr/0001-vite-over-nextjs.md)
- [ADR 0002 — Local-first persistence behind ports](docs/adr/0002-local-first-persistence.md)

## License

MIT.
