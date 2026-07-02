# RNOTE Architecture

RNOTE is engineered to grow from this foundation into a full Personal Life
Operating System without rewrites. That requires strict boundaries, a stable
core, and replaceable edges. We use **Clean Architecture** with **Domain-Driven
Design** and **SOLID** as the guiding constraints.

## The dependency rule

Source dependencies point **inward only**. An inner layer never imports an outer
one.

```
┌─────────────────────────────────────────────────────────────┐
│  presentation/     React, Zustand, Tiptap, Framer Motion     │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  application/    Use cases + ports (interfaces)        │  │
│  │  ┌─────────────────────────────────────────────────┐  │  │
│  │  │  domain/     Entities, value objects, events    │  │  │
│  │  │              (zero framework imports)           │  │  │
│  │  └─────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────┘  │
│                                                              │
│  infrastructure/   Dexie, FlexSearch, SystemClock           │
│      implements the application's ports (arrows point in)    │
└─────────────────────────────────────────────────────────────┘
        wiring happens once, in composition/container.ts
```

- **domain** depends on nothing. It is plain TypeScript and is 100% unit-testable
  with no mocks.
- **application** depends on domain and declares **ports** (interfaces) for
  everything it needs from the outside world.
- **infrastructure** depends on application + domain and **implements** the ports.
- **presentation** depends on application (for use cases and DTOs) and on domain
  for pure helpers/types. It never talks to infrastructure directly.
- **composition** is the only module allowed to import concrete infrastructure
  and wire it to the ports.

This is enforced structurally by path aliases (`@domain`, `@application`, …) and
by convention. The payoff: swapping IndexedDB for SQLite/Tauri, or FlexSearch for
another engine, touches exactly one file (`container.ts`).

## Layer responsibilities

### domain/

The heart of the product.

- `shared/` — the shared kernel: branded `Id`s, a functional `Result` type,
  `Entity`/`AggregateRoot` base classes, `DomainEvent`, and the `Clock`
  abstraction (time is injected, never read from `Date.now()` in the model).
- `blocks/` — the canonical block vocabulary (`BlockType`) and framework-free
  helpers over the ProseMirror JSON shape (`RichContent`: text extraction, word
  count, emptiness).
- `documents/` — the **Document** aggregate root (a page of blocks), the
  **DocumentContent** value object (immutable, self-validating), and lifecycle
  events. Documents guard their own invariants (title length, no self-parenting).
- `workspace/` — the **Workspace** aggregate.

Aggregates return `Result` for expected failures and only throw for programmer
errors. They record `DomainEvent`s that a future dispatcher/sync engine can
consume.

### application/

Orchestrates the domain to fulfil use cases.

- `ports/` — `DocumentRepository`, `WorkspaceRepository`, `SearchIndexPort`.
- `documents/DocumentService` — create, read, rename, re-icon, update content,
  move (with **cross-tree cycle detection**), archive/delete **subtree cascades**,
  and search. Each method is a small transaction-like unit: mutate the aggregate,
  persist it, keep the search index consistent.
- `workspace/WorkspaceService` — idempotent default-workspace bootstrap.
- `dto.ts` + `mappers.ts` — read models (`DocumentSummary`, `DocumentTreeNode`,
  `DocumentDetail`). The UI consumes these plain shapes, never domain entities.

### infrastructure/

The replaceable edges.

- `persistence/dexie/` — the `RnoteDatabase` schema, `Dexie*Repository`
  implementations, and record ⇄ domain mappers. Storage quirks live here (e.g.
  `parentId=''` for roots because IndexedDB can't index `null`; `isArchived` as
  `0|1` for compound indexes).
- `search/FlexSearchIndex` — full-text index with a parallel store for
  workspace-scoped filtering and snippet generation.
- `time/SystemClock` — the real clock.

### presentation/

The React app.

- `theme/` — the design system: **CSS custom-property tokens** (`tokens.css`),
  global/editor styles, and the dual-axis theming described below.
- `state/` — two Zustand stores: `preferences` (theme/mode/onboarding, persisted
  to `localStorage`) and `workspace` (the tree, active document, autosave). The
  workspace store is the bridge from UI events to use-case services.
- `editor/` — the Tiptap block editor, the dependency-free `/` command menu, and
  the icon picker.
- `sidebar/`, `topbar/`, `onboarding/`, `command-palette/`, `app/` — feature
  components. `components/`, `hooks/`, `lib/` — reusable primitives.

## Data flow (autosave example)

```
user types ─▶ Tiptap onUpdate ─▶ DocumentEditor.handleContentChange
   └▶ debounce 700ms ─▶ workspaceStore.saveContent(id, json)
        └▶ DocumentService.updateContent
             ├▶ DocumentContent.fromJSON (validate)
             ├▶ Document.replaceContent (mutate + raise event)
             ├▶ DocumentRepository.save  (IndexedDB)
             └▶ SearchIndexPort.upsert   (FlexSearch)
        └▶ store patches the tree row's preview in place (no refetch)
```

Structural operations (create / move / archive / delete) refetch the tree;
content edits patch in place to keep typing smooth.

## The dual-axis design system

Two orthogonal axes are set as attributes on `<html>`:

- `data-theme` = `light | dark` — controls neutral lightness and contrast.
- `data-mode` = `millennial | genz` — controls personality: hue, radius, motion
  and glow.

`tokens.css` defines four fully-specified combinations with deterministic CSS
specificity. Because the axes are pure presentation, **switching mode never
changes behaviour** — exactly as the product spec requires. A tiny inline script
in `index.html` applies the persisted choice before first paint to prevent a
flash of the wrong theme, and `prefers-reduced-motion` is honoured via a
`--motion-scale` token.

Fonts are **system stacks only** — RNOTE never blocks on a network to render,
reinforcing the offline-first promise.

## Cross-cutting concerns

- **Offline-first** — all reads/writes hit IndexedDB; the app is fully functional
  with no network. Search is client-side.
- **Accessibility** — semantic roles (`listbox`/`option`, `dialog`, `radiogroup`),
  visible `:focus-visible` rings, `aria-label`s on icon-only controls, and full
  keyboard operation of the editor menu and command palette.
- **Dark mode & responsiveness** — first-class via tokens; the sidebar collapses
  and the layout reflows on small screens.
- **Type safety** — TypeScript in `strict` mode with `noUncheckedIndexedAccess`
  and `noImplicitOverride`; the build fails on type errors.

## Edge cases handled in Milestone 1

- Moving a page into its own descendant (rejected — cycle detection).
- A page whose parent was archived/deleted (surfaces at root on restore; orphans
  never disappear from the tree).
- Empty workspace on first run (seeded with a welcome page).
- `localStorage` unavailable / private mode (preferences degrade to session-only).
- Identical content/title writes (skipped — no needless events or reindexing).
- Reduced-motion and no-JS-persistence users.
