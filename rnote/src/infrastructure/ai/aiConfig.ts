import type { AiProviderId } from '@application/ports/AiProvider';

/**
 * AI configuration persistence. localStorage is the single source of truth so
 * that both the composition root (`getAiProvider`) and the presentation store
 * (`useAiSettings`) read/write the same values without a circular dependency.
 * Keys are all under `rnote.ai.*`; nothing here ever leaves the device.
 */
export const AI_PROVIDER_IDS: AiProviderId[] = ['anthropic', 'openai', 'gemini', 'openrouter'];

export const PROVIDER_LABELS: Record<AiProviderId, string> = {
  anthropic: 'Anthropic (Claude)',
  openai: 'OpenAI',
  gemini: 'Google Gemini',
  openrouter: 'OpenRouter',
};

export const DEFAULT_MODELS: Record<AiProviderId, string> = {
  anthropic: 'claude-haiku-4-5',
  openai: 'gpt-4o-mini',
  gemini: 'gemini-2.0-flash',
  openrouter: 'anthropic/claude-3.5-haiku',
};

export interface AiConfig {
  enabled: boolean;
  provider: AiProviderId;
  /** Per-provider model overrides (fall back to DEFAULT_MODELS). */
  models: Partial<Record<AiProviderId, string>>;
  /** Per-provider API keys, local-only. */
  keys: Partial<Record<AiProviderId, string>>;
  autoOrganize: boolean;
  confidenceThreshold: number; // 0..100
}

const K = {
  enabled: 'rnote.ai.enabled',
  provider: 'rnote.ai.provider',
  models: 'rnote.ai.models',
  keys: 'rnote.ai.keys',
  autoOrganize: 'rnote.ai.autoOrganize',
  confidence: 'rnote.ai.confidence',
} as const;

function get(key: string): string | null {
  try {
    return localStorage.getItem(key);
  } catch {
    return null;
  }
}

function set(key: string, value: string): void {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* private mode — settings degrade to session-only */
  }
}

function parseMap(raw: string | null): Partial<Record<AiProviderId, string>> {
  if (!raw) return {};
  try {
    const obj = JSON.parse(raw) as Record<string, unknown>;
    const out: Partial<Record<AiProviderId, string>> = {};
    for (const id of AI_PROVIDER_IDS) {
      const v = obj[id];
      if (typeof v === 'string') out[id] = v;
    }
    return out;
  } catch {
    return {};
  }
}

export function readAiConfig(): AiConfig {
  const providerRaw = get(K.provider);
  const provider = (AI_PROVIDER_IDS as string[]).includes(providerRaw ?? '')
    ? (providerRaw as AiProviderId)
    : 'anthropic';
  const confidenceRaw = Number(get(K.confidence));
  const confidenceThreshold = Number.isFinite(confidenceRaw)
    ? Math.min(100, Math.max(0, confidenceRaw))
    : 70;
  return {
    enabled: get(K.enabled) === '1',
    provider,
    models: parseMap(get(K.models)),
    keys: parseMap(get(K.keys)),
    autoOrganize: get(K.autoOrganize) === '1',
    confidenceThreshold: get(K.confidence) === null ? 70 : confidenceThreshold,
  };
}

export function resolveModel(cfg: AiConfig): string {
  return cfg.models[cfg.provider] || DEFAULT_MODELS[cfg.provider];
}

export function resolveKey(cfg: AiConfig): string {
  return cfg.keys[cfg.provider] ?? '';
}

// ── Writers (each persists one concern; callers reload via readAiConfig) ──────
export function writeEnabled(enabled: boolean): void {
  set(K.enabled, enabled ? '1' : '0');
}
export function writeProvider(provider: AiProviderId): void {
  set(K.provider, provider);
}
export function writeModel(provider: AiProviderId, model: string): void {
  const models = parseMap(get(K.models));
  models[provider] = model;
  set(K.models, JSON.stringify(models));
}
export function writeKey(provider: AiProviderId, key: string): void {
  const keys = parseMap(get(K.keys));
  if (key) keys[provider] = key;
  else delete keys[provider];
  set(K.keys, JSON.stringify(keys));
}
export function writeAutoOrganize(on: boolean): void {
  set(K.autoOrganize, on ? '1' : '0');
}
export function writeConfidence(value: number): void {
  set(K.confidence, String(Math.min(100, Math.max(0, Math.round(value)))));
}
