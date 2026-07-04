import { ok, err, type Result } from '@domain/shared/Result';
import type { AiCompletionRequest, AiProvider } from '@application/ports/AiProvider';
import { postJson } from '../http';
import { aiError } from '../errors';
import { extractOpenAiText, type AiProviderConfig } from './shared';

/** OpenRouter — OpenAI-compatible gateway to many models. */
export class OpenRouterProvider implements AiProvider {
  readonly id = 'openrouter' as const;
  constructor(private readonly config: AiProviderConfig) {}

  async complete(req: AiCompletionRequest, signal?: AbortSignal): Promise<Result<string>> {
    const res = await postJson({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        authorization: `Bearer ${this.config.apiKey}`,
        // Dynamic so the app survives repo/domain renames.
        'HTTP-Referer': typeof location !== 'undefined' ? location.origin : 'https://rnote.local',
        'X-Title': 'RNOTE',
      },
      body: {
        model: this.config.model,
        max_tokens: req.maxTokens ?? 1024,
        temperature: req.temperature ?? 0.2,
        messages: req.messages.map((m) => ({ role: m.role, content: m.content })),
        ...(req.jsonSchemaHint ? { response_format: { type: 'json_object' } } : {}),
      },
      signal,
    });
    if (!res.ok) return res;
    const text = extractOpenAiText(res.value);
    return text !== null ? ok(text) : err(aiError('ai.bad-response', 'The AI response was empty.'));
  }
}
