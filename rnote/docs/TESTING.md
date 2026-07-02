# RNOTE Testing Strategy

Testing follows the shape of the architecture: the closer to the domain, the
heavier the coverage, because that is where correctness matters most and where
tests are cheapest (no mocks, no framework).

## The testing pyramid

```
        ╱ E2E (Playwright) ╲            — Milestone 7: real user journeys
      ╱ Component (RTL)     ╲           — Milestone 2+: editor & UI behaviour
    ╱ Application (integration)╲        — ✅ use cases against in-memory + real search
  ╱ Domain (pure unit)          ╲       — ✅ entities, value objects, invariants
```

## What Milestone 1 covers (25 tests, all green)

- **Domain unit tests** — pure, deterministic, mock-free (a `FakeClock` injects
  time):
  - `Document` — defaults, title trim/validation, rename events & idempotence,
    content replace events, self-parent rejection, archive/restore lifecycle.
  - `DocumentContent` — emptiness, invalid-JSON rejection, plain-text extraction,
    word count, preview, value equality.
  - `Workspace` — name validation and rename.
- **Application integration tests** — `DocumentService` wired to an in-memory
  repository and the **real** FlexSearch index:
  - Tree nesting and sibling ordering.
  - Move **cycle prevention** (cannot move a page into its own descendant).
  - Archive and delete **subtree cascades**.
  - Search by title and body, **scoped to a workspace**; archived pages leave the
    index.

## Principles

- **Test behaviour, not implementation.** Assertions target public outcomes
  (returned DTOs, `Result`s, emitted event names), never private state.
- **Determinism.** Time is injected via `Clock`; ids are generated but never
  asserted on directly. No wall-clock, no randomness in assertions.
- **Real over mocked where cheap.** The application tests use the real search
  engine and real domain objects; only persistence is a hand-written in-memory
  double that mirrors the Dexie adapter's semantics.
- **Fast.** The suite runs in well under two seconds, so it can gate every commit.

## Running

```bash
npm run test          # single run
npm run test:watch    # watch mode
npm run typecheck     # strict types (a form of testing)
npm run lint          # static analysis
```

Coverage is configured (`v8`) for `domain/` and `application/` — the layers
where coverage is meaningful.

## Roadmap

- **M2** — React Testing Library component tests for the editor, slash menu,
  sidebar interactions and command palette; a Dexie-backed repository contract
  test (run the same suite against in-memory and IndexedDB via `fake-indexeddb`).
- **M6** — sync/CRDT convergence property tests.
- **M7** — Playwright E2E covering onboarding → create → edit → search → reload.
