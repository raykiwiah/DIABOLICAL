import { domainError, type DomainError } from '@domain/shared/Result';

/** Canonical AI failure codes surfaced to the UI for friendly messaging. */
export type AiErrorCode =
  | 'ai.no-key'
  | 'ai.unauthorized'
  | 'ai.rate-limited'
  | 'ai.network'
  | 'ai.timeout'
  | 'ai.bad-response';

export const aiError = (code: AiErrorCode, message: string): DomainError => domainError(code, message);

/** Map an HTTP status from any provider onto a canonical AI error. */
export function errorForStatus(status: number, providerBody?: string): DomainError {
  if (status === 401 || status === 403) {
    return aiError('ai.unauthorized', 'Your API key was rejected. Check it in Settings.');
  }
  if (status === 429) {
    return aiError('ai.rate-limited', 'The provider is rate-limiting requests. Try again shortly.');
  }
  const detail = providerBody ? ` (${providerBody.slice(0, 120)})` : '';
  return aiError('ai.bad-response', `The AI provider returned HTTP ${status}.${detail}`);
}
