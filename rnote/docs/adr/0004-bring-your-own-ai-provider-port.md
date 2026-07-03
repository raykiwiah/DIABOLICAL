# ADR 0004 — Bring-your-own-AI via a provider port

- **Status:** Accepted
- **Date:** Upgrade 2, Phase A

## Context

The product is **AI-optional** and **bring-your-own-AI**: RNOTE must never ship a
model, an API key, or a backend, and must stay fully usable offline with no key.
Upcoming features (auto-organization, the Time Machine recaps and natural-language
ask) all need model access, but from a **static, local-first** app deployed to
GitHub Pages — there is no server to proxy calls through, and privacy is explicit.

## Decision

Introduce a single application-layer **port**, `AiProvider`, with one method
`complete(request, signal) → Promise<Result<string>>`. Concrete, dependency-free
`fetch` **adapters** live in `infrastructure/ai` — one per provider (Anthropic,
OpenAI, Gemini, OpenRouter). The composition root exposes a lazy
`getAiProvider()` that returns `null` when AI is off or no key is set; **every
caller must handle the null (degraded) path.**

AI configuration (enabled, provider, per-provider model + key, auto-organize,
confidence threshold) is persisted to `localStorage` under `rnote.ai.*`.
localStorage is the **single source of truth**, read by both the composition root
(`getAiProvider`) and the presentation store (`useAiSettings`), which avoids a
composition→presentation dependency while keeping the UI reactive.

## Rationale

- **A port keeps the dependency rule intact.** Domain and application stay pure;
  swapping or adding a provider is an infrastructure-only change. No SDKs — plain
  `fetch` keeps the bundle small and the browser the only runtime.
- **Direct-from-browser calls fit a serverless, local-first app.** Keys never
  leave the device and never touch a RNOTE server (there is none). Anthropic
  requires the explicit `anthropic-dangerous-direct-browser-access: true` header,
  which we set knowingly for this bring-your-own-key model.
- **Graceful degradation is structural, not incidental.** Because
  `getAiProvider()` can return `null`, offline/no-key is a first-class code path,
  not an error case — heuristic fallbacks (Phase B) slot in behind the same port.
- **Uniform failure handling.** A shared HTTP helper enforces a 30s timeout via
  `AbortSignal` and maps every provider's HTTP errors to canonical domain codes
  (`ai.unauthorized`, `ai.rate-limited`, `ai.network`, `ai.timeout`,
  `ai.bad-response`), so the UI messages once for all providers. A
  `parseJsonLoose` helper tolerates fenced/prose-wrapped JSON from any model.

## Consequences

- Users must supply their own key; "Test connection" validates it before use.
- Provider-specific request shaping (Anthropic/Gemini system-prompt split, Gemini
  role mapping, OpenAI/OpenRouter `response_format`) is isolated inside adapters
  and unit-tested with a mocked `fetch`.
- Presentation reads a small infrastructure config leaf (`aiConfig`) directly — a
  deliberate, documented exception to the usual presentation→application flow,
  justified because it is pure persistence with no domain logic.
