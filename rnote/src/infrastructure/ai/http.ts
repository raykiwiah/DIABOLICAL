import { ok, err, type Result } from '@domain/shared/Result';
import { aiError, errorForStatus } from './errors';

const DEFAULT_TIMEOUT_MS = 30_000;

export interface PostJsonConfig {
  url: string;
  headers: Record<string, string>;
  body: unknown;
  /** Caller cancellation (e.g. a superseded organization request). */
  signal?: AbortSignal;
  timeoutMs?: number;
}

/**
 * POST JSON with a hard timeout and canonical error mapping. Never throws —
 * always resolves to a Result so callers stay on the happy Result path.
 */
export async function postJson(cfg: PostJsonConfig): Promise<Result<unknown>> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), cfg.timeoutMs ?? DEFAULT_TIMEOUT_MS);

  // Chain the caller's signal into our controller so either can cancel.
  if (cfg.signal) {
    if (cfg.signal.aborted) controller.abort();
    else cfg.signal.addEventListener('abort', () => controller.abort(), { once: true });
  }

  try {
    const res = await fetch(cfg.url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...cfg.headers },
      body: JSON.stringify(cfg.body),
      signal: controller.signal,
    });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return err(errorForStatus(res.status, text));
    }
    const json: unknown = await res.json();
    return ok(json);
  } catch (e) {
    if (e instanceof DOMException && e.name === 'AbortError') {
      return err(aiError('ai.timeout', 'The AI request timed out or was cancelled.'));
    }
    return err(aiError('ai.network', 'Could not reach the AI provider. Check your connection.'));
  } finally {
    clearTimeout(timer);
  }
}
