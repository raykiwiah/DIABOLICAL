import type { Result } from '@domain/shared/Result';

/**
 * Bring-your-own-AI port. RNOTE never ships a model or a key; the user supplies
 * their own provider + key, and every AI feature degrades gracefully to a
 * heuristic/offline path when this port is unavailable (see `getAiProvider`).
 *
 * Defined in the application layer as a pure contract; concrete fetch-based
 * adapters live in `infrastructure/ai`. Domain never sees this.
 */
export interface AiMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

export interface AiCompletionRequest {
  messages: AiMessage[];
  /** Ask the model for a single JSON object matching a described schema. */
  jsonSchemaHint?: string;
  maxTokens?: number;
  temperature?: number;
}

export type AiProviderId = 'anthropic' | 'openai' | 'gemini' | 'openrouter';

export interface AiProvider {
  readonly id: AiProviderId;
  /** Resolve to the assistant's text, or a structured DomainError. Never throws. */
  complete(req: AiCompletionRequest, signal?: AbortSignal): Promise<Result<string>>;
}
