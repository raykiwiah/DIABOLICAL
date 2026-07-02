# ADR 0001 — Vite over Next.js for the app runtime

- **Status:** Accepted
- **Date:** Milestone 1

## Context

The product brief lists Next.js in the tech stack, alongside Tauri, SQLite and
IndexedDB, with the core principles **offline-first**, **local-first** and
**zero vendor lock-in**. RNOTE's data lives on the user's device and the target
distribution is a **Tauri desktop app** (with the browser as a secondary target).

The brief also states: *“Whenever multiple implementations exist, choose the one
that would be selected by the world's best software engineers.”*

## Decision

Use **Vite** (with `@vitejs/plugin-react`) as the application bundler and dev
server. Do **not** use Next.js for the application runtime.

## Rationale

- **Tauri's canonical pairing is Vite.** Tauri expects a static front-end served
  from a dev server; Vite is the default and best-supported choice, giving
  instant HMR and no server runtime.
- **Next.js's value is server-side.** SSR, server components, API routes, ISR and
  image optimization are the reasons to pick Next.js — and every one of them is
  irrelevant (or actively unwanted) for an app whose state is local and whose
  shell is native. Using Next.js in static-export mode reduces it to a heavier
  SPA bundler while forbidding its own headline features.
- **Simplicity and fewer failure modes.** A local-first app has no server; adding
  a server framework introduces concepts (hydration boundaries, the app router,
  RSC constraints) that buy nothing here and cost complexity.
- **Startup performance.** Vite dev startup and HMR are effectively instant,
  which matters for an editor with a large ProseMirror dependency graph.

This honours the **spirit** of the stack (React, TypeScript, Tailwind, Tiptap,
Zustand, Motion, FlexSearch, IndexedDB→SQLite via Tauri) while making the single
substitution a senior architect would defend.

## Consequences

- The app is a pure client bundle; routing (when needed) will be client-side.
- A future **marketing/docs website** — where SEO and SSR do matter — can be a
  separate Next.js app under `apps/web` without affecting the product runtime.
- The desktop shell will wrap this exact bundle with Tauri; `vite.config.ts`
  already pins a dev port and avoids obscuring Rust errors.

## Alternatives considered

- **Next.js static export (`output: 'export'`)** — works with Tauri but disables
  Next's advantages; net negative.
- **Create React App** — deprecated and slow; rejected.
- **Plain esbuild/Rollup** — more manual wiring than Vite for no benefit.
